const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Settings = require('../models/Settings');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { OAuth2Client } = require('google-auth-library');

// Lazily create the Google client so it always picks up the env var at request-time
let _googleClient = null;
const getGoogleClient = () => {
  if (!_googleClient) {
    if (!process.env.GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID is not configured');
    _googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return _googleClient;
};

// Sanitize sensitive data from logs
const sanitizeForLog = (data) => {
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    const SENSITIVE_FIELDS = ['password', 'token', 'email', 'resetPasswordToken'];
    SENSITIVE_FIELDS.forEach(field => {
      if (sanitized[field]) sanitized[field] = '[REDACTED]';
    });
    return sanitized;
  }
  return data;
};

const generateToken = (id, role) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Privacy: strip server-only fields before sending user to client on auth events
const sanitizeForClient = (userObj) => {
  const REMOVE = [
    'resetPasswordToken', 'resetPasswordExpire',
    'trustStrikes', 'isShadowBanned',
    'verificationDetails',
    'loginAttempts', 'lockUntil',
    'skippedMatches', 'organization'
  ];
  const obj = { ...userObj };
  REMOVE.forEach(k => delete obj[k]);
  return obj;
};

const Organization = require('../models/Organization');

const register = async (req, res) => {
  try {
    const { name, email, password, isGlobalUser, collegeData } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Please provide name, email, and password' });
      
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    
    let role = 'USER';
    let verificationStatus = 'APPROVED'; // Global users bypass walled-gardens explicitly.
    let orgId = undefined;

    if (!isGlobalUser) {
      if (!collegeData || !collegeData.name || !collegeData.domain) {
        return res.status(400).json({ message: 'Please provide valid college data or opt in as a global user.' });
      }

      let org = await Organization.findOne({ domain: collegeData.domain });
      if (!org) {
        org = await Organization.create({
          name: collegeData.name,
          domain: collegeData.domain,
          authorizedAdmins: [email.toLowerCase()]
        });
      }

      orgId = org._id;
      verificationStatus = 'PENDING';
      
      // Check Admin Claim
      if (org.authorizedAdmins && org.authorizedAdmins.map(e => e.toLowerCase()).includes(email.toLowerCase())) {
        role = 'ORG_ADMIN';
        verificationStatus = 'APPROVED';
      }
      // Strict Walled Garden: All other typical students remain PENDING until explicitly approved by the Org Admin.
    }

    const user = await User.create({ 
      name, 
      email, 
      password,
      organization: orgId,
      role,
      verificationStatus
    });
    
    // Fire-and-forget welcome email
    Settings.findOne().then(settings => {
      const template = settings?.emailTemplateWelcome || "<h1>Welcome {name}!</h1><p>We are glad to have you.</p>";
      const welcomeHtml = template.replace(/{name}/g, user.name);
      sendEmail({
        email: user.email,
        subject: 'Welcome to StudyFriend!',
        message: `Welcome ${user.name}!`,
        html: welcomeHtml
      }).catch(err => console.error('Welcome email dispatch suppressed:', err.message));
    }).catch(err => console.error('Settings query failed', err));
    
    // Privacy: sanitize before returning to client
    res.status(201).json({ token: generateToken(user._id, role.toLowerCase()), user: sanitizeForClient(user.toJSON()) });
  } catch (err) {
    console.error('Registration error:', sanitizeForLog(err));
    res.status(500).json({ message: 'An error occurred during registration' });
  }
};

const getOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find({}).select('name domain');
    res.json(orgs);
  } catch (err) {
    console.error('Get organizations error:', sanitizeForLog(err));
    res.status(500).json({ message: 'An error occurred' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check Admin database first
    let user = await Admin.findOne({ email }).select('+password +loginAttempts +lockUntil');
    let role = 'admin';
    
    if (!user) {
      // Fallback to User database
      user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
      role = 'user';
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({ 
        message: 'Account temporarily locked due to too many failed login attempts. Please try again later or reset your password.',
        lockedUntil: user.lockUntil
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account blocked by administrator' });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }
      
    const userData = sanitizeForClient(user.toJSON());
    if (role === 'admin') userData.isAdmin = true;
    
    res.json({ token: generateToken(user._id, role), user: userData });
  } catch (err) {
    console.error('Login error:', sanitizeForLog(err));
    res.status(500).json({ message: 'An error occurred during login' });
  }
};

const getMe = async (req, res) => {
  const userData = req.user.toJSON();
  if (req.user.role === 'admin') userData.isAdmin = true;
  res.json(userData);
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    let user = await Admin.findOne({ email });
    let role = 'admin';
    if (!user) {
      user = await User.findOne({ email });
      role = 'user';
    }
    
    if (!user) {
      // Privacy: always return 200 to prevent email enumeration attacks
      return res.status(200).json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const settings = await Settings.findOne();
    const template = settings?.emailTemplateReset || '<h1>Reset Password</h1><p>Click <a href="{link}">here</a> to reset.</p>';
    const resetHtml = template.replace(/{link}/g, resetUrl).replace(/{name}/g, user.name);

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please go to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message: message,
        html: resetHtml,
        resetUrl: resetUrl
      });

      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (err) {
    console.error('Password reset error:', sanitizeForLog(err));
    res.status(500).json({ message: 'An error occurred' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    let user = await Admin.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
      });
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password reset token error:', sanitizeForLog(err));
    res.status(500).json({ message: 'An error occurred' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new passwords' });
    }
    
    let user = await Admin.findById(req.user._id);
    if (!user) {
      user = await User.findById(req.user._id);
    }
    
    if (!user || !(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: 'Incorrect current password' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password change error:', sanitizeForLog(err));
    res.status(500).json({ message: 'An error occurred' });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Google credential token is missing.' });

    // Step 1: Verify the Google ID token
    let payload;
    try {
      const googleClient = getGoogleClient();
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (tokenErr) {
      console.error('Google token verification failed:', tokenErr.message);
      return res.status(401).json({
        message: 'Google sign-in failed — invalid or expired token. Please try again.',
      });
    }

    const { email, name, picture } = payload;
    if (!email) return res.status(400).json({ message: 'Google account has no email address.' });

    // Step 2: Look up user in DB
    let user = await Admin.findOne({ email });
    let role = 'admin';

    if (!user) {
      user = await User.findOne({ email });
      role = 'user';
    }

    // Step 3: Auto-register if first time
    if (!user) {
      const { isGlobalUser, collegeData } = req.body;

      let newRole = 'USER';
      let verificationStatus = 'APPROVED';
      let orgId = undefined;

      if (!isGlobalUser) {
        if (!collegeData || !collegeData.name || !collegeData.domain) {
          return res.status(404).json({
            message: 'No account found. Please complete registration to select your institution first.',
          });
        }

        let org = await Organization.findOne({ domain: collegeData.domain });
        if (!org) {
          org = await Organization.create({
            name: collegeData.name,
            domain: collegeData.domain,
            authorizedAdmins: [email.toLowerCase()],
          });
        }

        orgId = org._id;
        verificationStatus = 'PENDING';

        if (org.authorizedAdmins && org.authorizedAdmins.map(e => e.toLowerCase()).includes(email.toLowerCase())) {
          newRole = 'ORG_ADMIN';
          verificationStatus = 'APPROVED';
        }
      }

      const randomPassword = crypto.randomBytes(20).toString('hex');
      user = await User.create({
        name,
        email,
        password: randomPassword,
        avatar: picture,
        organization: orgId,
        role: newRole,
        verificationStatus,
      });
      role = 'user';

      // Fire-and-forget welcome email — never block the response
      (async () => {
        try {
          const settings = await Settings.findOne();
          const template = settings?.emailTemplateWelcome || '<h1>Welcome {name}!</h1><p>We are glad to have you.</p>';
          await sendEmail({
            email: user.email,
            subject: 'Welcome to StudyFriend!',
            message: `Welcome ${user.name}!`,
            html: template.replace(/{name}/g, user.name),
          });
        } catch (mailErr) {
          console.error('Welcome email suppressed:', mailErr.message);
        }
      })();
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been blocked by an administrator.' });
    }

    const userData = sanitizeForClient(user.toJSON());
    if (role === 'admin') userData.isAdmin = true;

    return res.json({ token: generateToken(user._id, role), user: userData });
  } catch (err) {
    console.error('Google Auth unexpected error:', err);
    return res.status(500).json({ message: 'An unexpected server error occurred. Please try again.' });
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword, changePassword, googleAuth, getOrganizations };
