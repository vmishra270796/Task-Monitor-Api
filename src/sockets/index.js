export const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    socket.on('disconnect', () => {});
  });
};
