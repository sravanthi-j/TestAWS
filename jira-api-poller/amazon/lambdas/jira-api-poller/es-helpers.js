const AWS = require('aws-sdk')
const { Client } = require('@elastic/elasticsearch')
const createAwsElasticsearchConnector = require('aws-elasticsearch-connector')
const jira = require('./jira-api-helpers')

const ENV = process.env;
const esNode = ['https://', ENV.es_endpoint || 'localhost:9200'].join('');
// this client config  for local develop
// TODO: write test that will moke this
// // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/client-configuration.html
// const client = new Client({
//   node: {
//     url: new URL('https://192.168.88.106:9200')
//   },
//   auth: {
//     username: 'admin',
//     password: 'admin'
//   },
//   //     https://haxefoundation.github.io/hxnodejs/js/node/tls/SecureContextOptions.html
//   //     https://stackoverflow.com/questions/62792477/cant-connect-to-elasticsearch-with-node-js-on-kubernetes-self-signed-certifica
//   ssl: {
//     rejectUnauthorized: false
//   }
// })
const client = new Client({
  ...createAwsElasticsearchConnector(AWS.config),
  node: esNode
})

exports.indexExists = async (project) => {
  try {
    const resp = await client.indices.exists({
      index: `${project.es_index_name}`,
    })
    return resp.body
  } catch (e) {
    console.error(e)
  }
}


exports.pushToES = async (project, body) => {
  let today = new Date()
  try {
    const resp = await client.index(
      {
        index: `${project.es_index_name}`,
        // TODO: new index per day .. or check mapings .. maybe manual mapings 
        // index: `${project.es_index_name}-${today.toISOString().slice(0, 10)}`,
        body: body
      }
    );
    console.log(`pushed to es for ${project.name} index ${project.es_index_name}-${project.es_index_name}-${today.toISOString().slice(0, 10)}`)
  } catch (e) {
    console.error(e)
  }
}

