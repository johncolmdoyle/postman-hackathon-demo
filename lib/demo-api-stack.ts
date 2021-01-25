import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';

interface DemoApiStackProps extends cdk.StackProps {
  readonly certificate: acm.ICertificate;
  readonly regionalCert: acm.ICertificate;
  readonly domainName: string;
  readonly subDomainName: string;
  readonly env: any;
}

export class DemoApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: DemoApiStackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const versionLambda = new lambda.Function(this, 'versionFunction', {
      code: new lambda.AssetCode('src'),
      handler: 'version.handler',
      runtime: lambda.Runtime.NODEJS_10_X,
    });

    const healthLambda = new lambda.Function(this, 'healthFunction', {
      code: new lambda.AssetCode('src'),
      handler: 'health.handler',
      runtime: lambda.Runtime.NODEJS_10_X
    });

    // API
    const api = new apigateway.RestApi(this, 'demoApi', {
      restApiName: 'Postman Hackathon Demo API',
    });

    const regionalApiCustomDomain = new apigateway.DomainName(this, 'regionalApiCustomDomain', {
      domainName: props.env.region.concat("." + props.domainName),
      certificate: props.regionalCert
    });

    regionalApiCustomDomain.addBasePathMapping(api);

    const restApiCustomDomain = new apigateway.DomainName(this, 'restApiCustomDomain', {
      domainName: props.subDomainName.concat(props.domainName),
      certificate: props.certificate
    });

    restApiCustomDomain.addBasePathMapping(api);

    const v1 = api.root.addResource('v1');

    const versionIntegration = new apigateway.LambdaIntegration(versionLambda);
    v1.addMethod('GET', versionIntegration);
    addCorsOptions(v1);

    const zone = route53.HostedZone.fromLookup(this, "zone", { domainName: props.domainName });

    const regionalApiRecord = new route53.ARecord(this, 'regionalApiCustomDomainAliasRecord', {
      zone: zone,
      recordName: props.env.region,
      target: route53.RecordTarget.fromAlias(new targets.ApiGatewayDomain(regionalApiCustomDomain))
    });

    const regionalRecordHealthCheck = new route53.CfnHealthCheck(this, 'regionApiDomainHealthCheck', {
      healthCheckConfig: {
        type: "HTTPS",
        port: 443,
        enableSni: true,
        fullyQualifiedDomainName: props.env.region.concat("." + props.domainName),
        resourcePath: "/health"
      },
      healthCheckTags: [{
        key: "Name",
        value: "Demo API Health Check ".concat(props.env.region)
      }]
    });

    const globalApiRecord = new route53.CfnRecordSet(this, 'globalApiDomain', {
      name: props.subDomainName.concat(props.domainName + "."),
      type: "A",
      aliasTarget: {
        dnsName: restApiCustomDomain.domainNameAliasDomainName,
        hostedZoneId: restApiCustomDomain.domainNameAliasHostedZoneId
      },
      hostedZoneId: zone.hostedZoneId,
      region: props.env.region,
      setIdentifier: "demo-api-" + props.env.region
    });
  }
}

export function addCorsOptions(apiResource: apigateway.IResource) {
  apiResource.addMethod('OPTIONS', new apigateway.MockIntegration({
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Credentials': "'false'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
      },
    }],
    passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
    requestTemplates: {
      "application/json": "{\"statusCode\": 200}"
    },
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    }]
  })
}
