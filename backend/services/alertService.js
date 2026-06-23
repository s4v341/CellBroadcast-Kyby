const broadcastAlert = (event, data) => {
  if (global.io) {
    console.log(`[${new Date().toISOString()}] Transmitindo evento: ${event}`);
    global.io.emit(event, {
      ...data,
      transmitted_at: new Date().toISOString(),
      connected_users: global.io.engine.clientsCount
    });
  }
};

const notifyAdminAction = (action, details) => {
  if (global.io) {
    global.io.emit('admin:action', {
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  broadcastAlert,
  notifyAdminAction
};
