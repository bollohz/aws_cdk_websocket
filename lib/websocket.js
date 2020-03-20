const cdk = require('@aws-cdk/core');
const apiv2 = require('@aws-cdk/aws-apigatewayv2');

const protocolType = {
  WEBSOCKET: "WEBSOCKET",
  HTTP: "HTTP"
};

const loggingLevel = {
  DEBUG: "DEBUG"
};

const integrationType = {
  AWS: "AWS",
  AWS_PROXY: "AWS_PROXY",
  HTTP: "HTTP",
  HTTP_PROXY: "HTTP_PROXY",
  MOCK: "MOCK"
};

const routeKey = {
  DEFAULT: "$default",
  CONNECT: "$connect",
  DISCONNECT: "$disconnect"
};

const contentType = {
  JSON: "application/json",
  XML: "application/xml",
  TEXT: "text/plain",
  URL_ENCONDED: "application/x-www-form-urlencoded",
  FORM_DATA: "multipart/form-data"
};

const integrationMethod = {
  GET: "GET"
};

const connectionType = {
  INTERNET: "INTERNET",
  VPC_LINK: "VPC_LINK"
};

class Websocket extends cdk.Resource{
  
  constructor(stack, id, props) {
    super(stack, id);
    this.api = {};
    this.integration = {};
    this.route = [];
    if (props === null || props === undefined) {
      props = {}
    }
    this.api = new apiv2.CfnApi(stack, id + "-ws", {
      ...props,
      protocolType: props.protocolType || protocolType.WEBSOCKET,
      routeSelectionExpression: props.routeSelectionExpression || '${request.body.message}'
    });
    this.api.addPropertyOverride('Name', props.name || this.api.logicalId);
    this.apiId = this.api.logicalId;
    
    if ((props.deploy === true) || (props.deploy === undefined)) {
      let stageName = props.stageName || 'prod';
      
      this.deployment = new apiv2.CfnDeployment(this, 'Deployment', {
        description: 'Automatically created by the Api construct',
        apiId: this.api.ref
        // No stageName specified, this will be defined by the stage directly, as it will reference the deployment
      });
      
      if(!props.hasOwnProperty('deployOptions')){
        props.deployOptions = {}
      }
      
      this.stage = new apiv2.CfnStage(this, `Stage.${stageName}`, {
        ...props.deployOptions,
        deploymentId: this.deployment.ref,
        stageName: stageName,
        apiId: this.api.ref,
        description: 'Automatically created by the Api construct',
      });
    }
    
    const output = new cdk.CfnOutput(stack, id + "-output", {
      value: this.clientUrl(stack)
    });
    
    const outputConn = new cdk.CfnOutput(stack, id + "-outputConnections", {
      value: this.connectionsUrl(stack)
    });
    
    return this;
  }
  
  getApi() {
    return this.api;
  }
  
  clientUrl(context) {
    const stack = cdk.Stack.of(context);
    return `wss://${this.api.ref}.execute-api.${stack.region}.amazonaws.com/${this.stage.stageName}`;
  }
  
  connectionsUrl(context) {
    const stack = cdk.Stack.of(context);
    return `https://${this.api.ref}.execute-api.${stack.region}.amazonaws.com/${this.stage.stageName}/@connections`;
  }
  
  addIntegration(stack, id, props){
    props.integrationUri = props.uri || undefined;
    props.integrationMethod = props.integrationMethod || integrationMethod.GET;
    const integration = new apiv2.CfnIntegration(this, id + '-integration', {
      ...props,
      integrationType: integrationType.HTTP_PROXY,
      connectionType: connectionType.INTERNET,
      apiId: this.api.ref
    });
    this.integration = integration;
    this.route[props.routeKey] = new apiv2.CfnRoute(stack, id + "-route", {
      apiId: this.api.ref,
      routeKey: props.routeKey,
      authorizationType: props.authorizationType || "NONE",
      operationName: props.operationName || "defaultOperation",
      target: cdk.Fn.join("/", ['integrations', integration.ref])
    });
    this.deployment.addDependsOn(this.route[props.routeKey]);
  }
  
  addLambdaIntegration(functionIntegration){
    //#TODO: implement lambda integration
  }
}

module.exports = {
  Websocket,
  protocolType,
  integrationType,
  integrationMethod,
  contentType,
  connectionType,
  routeKey
};
