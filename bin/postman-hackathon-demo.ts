#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DemoCertStack } from '../lib/demo-cert-stack';
import { DemoApiStack } from '../lib/demo-api-stack';

const app = new cdk.App();

const deployRegions = ["af-south-1", "ap-east-1", "eu-south-1", "me-south-1"];
const domainName = "api-network.info";
const subDomainName = "demo.";

deployRegions.forEach(function (item, index) {
  const regioncertstack = new DemoCertStack(app, 'Postman-Demo-Cert-'.concat(item), {
    env: {account: process.env.CDK_DEFAULT_ACCOUNT, region: item},
    domainName: domainName,
    subDomainName: subDomainName});

  const regionstack = new DemoApiStack(app, 'Postman-Demo-Api-'.concat(item), {
    env: {account: process.env.CDK_DEFAULT_ACCOUNT, region: item},
    domainName: domainName,
    subDomainName: subDomainName,
    certificate: regioncertstack.cert,
    regionalCert: regioncertstack.regionalCert,
  });

  regionstack.addDependency(regioncertstack);
});

cdk.Tags.of(app).add("app", "postman-hackathon");
