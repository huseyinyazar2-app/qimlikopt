// Merkezi yapilandirma.
// Qimlik'in kendi gateway SIM numarasi: demo (/dene), kayit ve sistem seed'lerinde
// kullanilan varsayilan numara. Musteriler kendi gateway numaralarini panelden ayarlar.
// Ortam degiskeni GATEWAY_PHONE ile override edilebilir (rakam, +90 olmadan, ornek: 905404234000).
const GATEWAY_PHONE = process.env.GATEWAY_PHONE || '905404234000';

module.exports = { GATEWAY_PHONE };
