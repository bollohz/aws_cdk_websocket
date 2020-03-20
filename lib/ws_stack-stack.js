const cdk = require('@aws-cdk/core');
const websocket = require("./websocket");

class WsStackStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);
  
    const websocketApi = new websocket.Websocket(this, "websocket", {
      name: "testwebsocket",
      description: "websocketdescription",
      routeSelectionExpression: "${request.body.phase}"
    });
  
    websocketApi.addIntegration(this, 'iqp-ws',{
      uri: "http://uri_test",
      routeKey: websocket.routeKey.DEFAULT
    });
  }
}

module.exports = {
  WsStackStack
};
