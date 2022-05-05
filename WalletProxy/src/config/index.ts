require('dotenv').config();

module.exports = {
  environment: process.env.NODE_ENV,
  rpcs: {
    port: process.env.LOCAL_RPC_PORT,
    user: process.env.LOCAL_RPC_USER,
    password: process.env.LOCAL_RPC_PASSWORD,
  },
  web: {
    port: process.env.WEB_PORT,
  },
};
