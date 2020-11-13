/*
 * Sample node.js code for AWS Lambda to upload the JSON documents
 * pushed from Kinesis to Amazon Elasticsearch.
 *
 * Copyright 2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
/* == Imports == */
'use strict'

var AWS = require('aws-sdk');
var path = require('path');
const zlib = require('zlib');
const { Client } = require('@elastic/elasticsearch');
const createAwsElasticsearchConnector = require('aws-elasticsearch-connector');
const { timeStamp } = require('console');

const ENV = process.env;
const esNode = ['https://', ENV.es_endpoint || 'localhost:9200'].join('');
const client = new Client({
  ...createAwsElasticsearchConnector(AWS.config),
  node: esNode
});

require('array.prototype.flatmap').shim();

/* Lambda "main": Execution begins here */
exports.handler =async function(event, context) {
    console.log(JSON.stringify(event, null, '  '));
    await client.indices.create({
        index: "document-manager-du-dev-firestop",
        body: {
          mappings: {
            properties: {
              id: { type: 'integer' },
              message: { type: 'text' },
              time: { type: 'date' }
            }
          }
        }
      }, { ignore: [400] })
   for (const record of event.Records.values()) {
        var payload = new Buffer(record.kinesis.data, 'base64');
        var jsonDoc = JSON.parse(zlib.unzipSync(payload)).logEvents;
        const body = jsonDoc.flatMap(doc => [{
            index: { 
                _index: "document-manager-" + (JSON.parse(zlib.unzipSync(payload)).logGroup),
                _type: 'dm-kinesis',
            }
        }, doc]);
        console.log(body)
        const { body: bulkResponse } = await client.bulk({ refresh: true, body });
       
        if (bulkResponse.errors) {
            const erroredDocuments = []
             // The items array has the same order of the dataset we just indexed.
             // The presence of the `error` key indicates that the operation
             // that we did for the document has failed.
            bulkResponse.items.forEach((action, i) => {
               const operation = Object.keys(action)[0]
              if (action[operation].error) {
                erroredDocuments.push({
                   // If the status is 429 it means that you can retry the document,
                   // otherwise it's very likely a mapping error, and you should
                   // fix the document before to try it again.
                status: action[operation].status,
                error: action[operation].error,
                operation: body[i * 2],
                document: body[i * 2 + 1]
                })
              }
        })
      console.log(erroredDocuments)
      }
      const { body: count } = await client.count({ index: "document-manager-" + (JSON.parse(zlib.unzipSync(payload)).logGroup) })
    };
}