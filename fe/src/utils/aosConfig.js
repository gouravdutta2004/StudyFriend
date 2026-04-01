import AOS from 'aos';

export const initAOS = () => {
  const isMobile = window.innerWidth < 768;
  
  AOS.init({
    duration: isMobile ? 400 : 800,
    once: true,
    offset: 50,
    easing: 'ease-out-cubic',
    disable: false,
    anchorPlacement: 'top-bottom'
  });
};

export const refreshAOS = () => {
  AOS.refresh();
};
