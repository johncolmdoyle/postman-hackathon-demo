# Postman Hackathon Demo

An example API to demonstrate the [API Network](https://github.com/johncolmdoyle/postman-hackathon) submission to the [Postman API Hackathon](https://postman-hack.devpost.com/).

## Deployment

This API is deployed into 4 AWS regions with a latency routing policy:

- af-south-1
- ap-east-1
- eu-south-1
- me-south-1

![](images/deployment-zones.png?raw=true)

## Response

There is a single endpoint that returns the version of the lambda deployed and the region that is responding.

```bash
$ curl https://demo.api-network.info/v1
```

```json
{
  "version":"1.0.0",
  "region":"eu-south-1"
}
```

## Deployment

### Enable AWS Regions

The four AWS regions selected are not be default enabled. You will need to enable them within your [AWS account settings](https://console.aws.amazon.com/billing/home?#/account).

### First Deploy

Before we can deploy our code, we first must bootstrap the regions with CDK. This can be done running the following command:

```bash
$ node bootstrap.js
```

### Deploy APIs

All the apis can be deployed with the follwing commands:

```bash
$ npm install
$ npm run deploy
```
