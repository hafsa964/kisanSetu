let ioInstance;

function initSocket(io) {
  ioInstance = io;
  io.on('connection', (socket) => {
    socket.on('join_farmer_room', (farmerId) => {
      socket.join(`farmer_${farmerId}`);
    });
    socket.on('join_centre_room', (centreId) => {
      socket.join(`centre_${centreId}`);
    });
  });
}

function emitToFarmer(farmerId, event, payload) {
  if (ioInstance) ioInstance.to(`farmer_${farmerId}`).emit(event, payload);
}

function emitToCentre(centreId, event, payload) {
  if (ioInstance) ioInstance.to(`centre_${centreId}`).emit(event, payload);
}

module.exports = { initSocket, emitToFarmer, emitToCentre };
