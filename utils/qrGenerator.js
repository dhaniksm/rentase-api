const QRCode = require('qrcode');

const generateVehicleQRCode = async ({ vehicleId, plateNumber }) => {
  const qrPayload = {
    vehicleId,
    plateNumber
  };

  return QRCode.toBuffer(JSON.stringify(qrPayload), {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 512
  });
};

module.exports = {
  generateVehicleQRCode
};
