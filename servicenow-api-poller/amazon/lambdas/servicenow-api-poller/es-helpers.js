const AWS = require('aws-sdk')
const { Client } = require('@elastic/elasticsearch')
const createAwsElasticsearchConnector = require('aws-elasticsearch-connector')

const ENV = process.env;
const esNode = ['https://', ENV.es_endpoint || 'localhost:9200'].join('');

console.log(esNode)

const client = new Client({
  ...createAwsElasticsearchConnector(AWS.config),
  node: esNode
})
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

exports.existsById = async (project, id) => {
  try {
    const resp = await client.exists({
      index: `${project.es_index_name}`,
      id: id
    })
    
    return resp.body
  } catch (e) {
    console.error(e)
  }
}

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

exports.maxId = async (project) => {
  try {
    const resp = await client.search({
      index: `${project.es_index_name}`,
      body: {
          aggs: {
            max_id: { "max": { "field": "job.id" } }
        }
      }
    })
    return resp.body.aggregations.max_id
  } catch (e) {
    console.error(e)
  }
}

exports.pushToES = async (es_index_name, body) => {
  let today = new Date()
  try {
    const resp = await client.index(
      {
        // id: id,
        index: `${es_index_name}`,
        // TODO: new index per day .. or check mapings .. maybe manual mapings 
        // index: `${project.es_index_name}-${today.toISOString().slice(0, 10)}`,
        body: body
      }
    );
    // console.log(`pushed to es for ${project.fullPath} index ${project.es_index_name}-${today.toISOString().slice(0, 10)}`)
    console.log(`pushed to es for index ${es_index_name}`)
    return resp
  } catch (e) {
    console.error(e)
  }
}

