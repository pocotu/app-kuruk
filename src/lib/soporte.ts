// Contacto de soporte: un solo lugar para el correo y el número.
const mensaje = 'Hola, necesito ayuda con KURUK.';

export const soporte = {
  telefono: '921 041 665',
  email: 'cpc.mizrain@gmail.com',
  whatsapp: `https://wa.me/51921041665?text=${encodeURIComponent(mensaje)}`,
  mailto: `mailto:cpc.mizrain@gmail.com?subject=${encodeURIComponent('Soporte KURUK')}`,
};
