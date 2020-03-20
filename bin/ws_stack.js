#!/usr/bin/env node

const cdk = require('@aws-cdk/core');
const { WsStackStack } = require('../lib/ws_stack-stack');

const app = new cdk.App();
new WsStackStack(app, 'WsStackStack');
