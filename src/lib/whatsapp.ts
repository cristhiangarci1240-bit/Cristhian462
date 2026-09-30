export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function buildWhatsAppLink(
  phoneNumber: string,
  messageTemplate: string,
  productName?: string
): string {
  const cleanNumber = cleanPhoneNumber(phoneNumber);
  let text = messageTemplate;

  if (productName) {
    text = text.replace(/\[NOME DO PRODUTO\]/g, productName);
    text = text.replace(/\[NOME\]/g, productName);
  }

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text.trim())}`;
}
