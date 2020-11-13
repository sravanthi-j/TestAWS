var AWS = require('aws-sdk');
var cloudwatch = new AWS.CloudWatch({ region: 'eu-west-1'});


const ENV = process.env;
const esNode = ['https://', ENV.esEndpointUrl || 'localhost:9200'].join('');


const { Client } = require('@elastic/elasticsearch');
const createAwsElasticsearchConnector = require('aws-elasticsearch-connector');
const elasticSearchClient = new Client({
  ...createAwsElasticsearchConnector(AWS.config),
  node: esNode
});


exports.handler = function (event, context) {
    var ElasticSearchHost =  esNode;
    var Environment = 'dev-temp';
    var EndTime = new Date;
    var StartTime = new Date(EndTime - 15*60*1000);
    var Metrics = {
        AutoScalingGroup: [{
            'Namespace': 'AWS/EC2',
            'MetricNames': ['CPUUtilization','NetworkIn']
        }],
        'LoadBalancer': [{
            'Namespace': 'AWS/ApplicationELB',
            'MetricNames': ['HealthyHostCount','UnHealthyHostCount','RequestCount','HTTPCode_Target_2XX_Count','HTTPCode_Target_3XX_Count','HTTPCode_Target_4XX_Count','HTTPCode_Target_5XX_Count']
        }],
        'ElastiCache': [{
            'Namespace': 'AWS/ElastiCache',
            'MetricNames': ['CacheMisses','CacheHits','CPUUtilization','CurrItems','CurrConnections']
        }],
        'Database': [{
            'Namespace': 'AWS/RDS',
            'MetricNames': [
                'DatabaseConnections','CPUUtilization','SwapUsage',
                'WriteIOPS','ReadIOPS',
                'WriteLatency','ReadLatency',
                'WriteThroughput','ReadThroughput'
            ]
        }]
    };

    console.log('Start: ' + StartTime);
    console.log('End: ' + EndTime);

    var bulkData = {body:[]};
    var callbackLevel = 0;

    var getMetricStatistics = function(type, avzone, servicename ,dimensions) {
        Metrics[type].forEach(function (metric) {
            var Namespace = metric.Namespace;
            metric.MetricNames.forEach(function (MetricName) {
                callbackLevel++;
                var params = {
                    Period: 60,
                    StartTime: StartTime,
                    EndTime: EndTime,
                    MetricName: MetricName,
                    Namespace: Namespace,
                    Statistics: ['SampleCount', 'Average', 'Sum', 'Minimum', 'Maximum'],
                    Dimensions: dimensions
                };
                console.log('Fetching ' + Namespace + ':' + MetricName + ' for ' + dimensions[0].Value);
                cloudwatch.getMetricStatistics(params, function (err, data) {
                    console.log(data)
                    if (err) {
                        console.log(err, err.stack);
                    } else {
                        data.Datapoints.forEach(function (datapoint) {

                            datapoint.Namespace = Namespace;
                            datapoint.MetricName = MetricName;
                            datapoint.Dimension = dimensions[0];
                            datapoint.Environment = Environment;


                            var type = MetricName;
                            if (Namespace == 'AWS/ApplicationELB') {
                                //type += ':' + dimensions[0].Value;
                                datapoint.AvailabilityZone = dimensions[1].Value;
                            }
                            /*if (Namespace == 'AWS/ElastiCache') {
                                type += ':' + dimensions[0].Value;
                            }*/
                            // push instruction
                            bulkData.body.push({
                                index: {
                                    _index: 'cloudwatch-metrics-',
                                    //_type: 'metrics',
                                  //  _id: Math.floor(datapoint.Timestamp.getTime() / 1000)
                                }
                            });
                            
                            // push data
                            bulkData.body.push(datapoint);
                        });
                        callbackLevel--;
                        if (callbackLevel == 0) {
                            console.log(bulkData);
                            sendToElasticSearch(bulkData);
                        }
                    }
                });
            })
        });
    };

    var sendToElasticSearch =async function(bulkData) {
        if (bulkData.body.length > 0) {
            console.log('Sending ' + (bulkData.body.length/2) + ' metrics to ElasticSearch:');
            //console.log(bulkData.body.index)
            var body=bulkData.body
            const { body: bulkResponse } = await elasticSearchClient.bulk({refresh: true, body:body});
       
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
            })}
            /*await elasticSearchClient.bulk(bulkData.body, function(err, data) {
                if (err) {
                    errorExit(err, context);
                    console.log(data)/
                } else {
                    console.log(data);
                    context.succeed();
                }
            });*/
        } else {
            console.log(body);
            context.done();
        }
    };

    var findElastiCache = function(callback) {
        var elasticache = new AWS.ElastiCache({apiVersion: '2015-02-02', region: 'eu-west-1'});
        elasticache.describeCacheClusters({}, function(err, data) {
            if (err) {
                callback(err, data);
            } else {
                var found = 0;
                data.CacheClusters.forEach(function(item) {
                    if (item.CacheClusterId.indexOf('mg-'+Environment) == 0) {
                        found++;
                        callback(null, item.CacheClusterId);
                    }
                });
                if (found != 2) {
                    callback('Could not find both ElastiCache clusters', null);
                }
            }
        });
    };

    var findDatabase = function(callback) {
        var rds = new AWS.RDS({apiVersion: '2014-10-31', region: 'eu-west-1'});
        rds.describeDBInstances({}, function(err, data) {
            if (err) {
                callback(err, data);
            } else {
                var found = 0;
                console.log(data)
                data.DBInstances.forEach(function(item) {
                    if (item.DBInstanceIdentifier == 'hilti-carina-profservice') {
                        found++;
                        callback(null, item.DBInstanceIdentifier);
                    }
                });
                if (!found) {
                    callback('Database not found', null);
                }
            }
        });
    };

    var findLoadBalancerName = function(callback) {
        var cluster = new AWS.ECS();
        var elb = new AWS.ELBv2({ region: 'eu-west-1'});
        var ecs_service_filter = ["hilti-carina-","hilti-pe-"]
        
        var list_params = {
          cluster: 'hilti-main',
          maxResults: '100',
        };
        cluster.listServices(list_params, function (err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else     {
            //console.log(data);           // successful response
            var services_names = [];
            data.serviceArns.forEach(function (item) {
                var splitarr = item.split("/");
                //console.log(splitarr[1]);
                ecs_service_filter.forEach( function (item) {
                    //console.log(item)
                    if (splitarr[1].includes(item)) 
                    {    
                        var input =  splitarr[1];
                        var service_params = {
                            services: [input],
                            cluster: "arn:aws:ecs:eu-west-1:904425940166:cluster/hilti-main",
                        }
                        //console.log(service_params)
                        cluster.describeServices(service_params, function(err, data) {
                            if (err) { 
                                console.log(err, err.stack);
                                
                            } // an error occurred
                            else  {
                                
                                console.log(data.loadBalancers);
                                elb.describeLoadBalancers({}, function(err, data) {
                                    console.log(data)
                                    if (err) {
                                        callback(err, data);
                                    } else {
                                        var found = 0;
                                        var names = [];
                                        // find loadbalancer by tag
                                        data.LoadBalancers.forEach(function (item) {
                                          if (item.LoadBalancerName == "pe-core-webservices-08fedebea992")  {
                                          found++;
                                          names.push("app/pe-core-webservices-08fedebea992/e568c5c8f70eab1e");
                                          LoadBalancerName = "app/pe-core-webservices-08fedebea992/e568c5c8f70eab1e"
                                          //callback(null, item.LoadBalancerName);
                                          callback(null, LoadBalancerName);
                                          }
                                        });
                        
                                        if (!found) {
                                          callback('No load balancer found', null);
                                      }
                                    }
                                });


                            }              // successful response
                            });
                        //console.log("Push name:")
                        //console.log(input)                        
                        //services_names.push(input);
                        
                    //console.log(splitarr[1]);
                    }   
                });
            });
            

            }
           
        });
        
        //console.log("service_names");
        //console.log(services_names);
        /*cluster.describeServices({}, function(err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else     console.log(data);           // successful response
        });*/


    };

    var findAutoScalingGroup = function(callback) {
        var autoscaling = new AWS.AutoScaling({ region: 'eu-west-1'});
        autoscaling.describeAutoScalingGroups({}, function(err, data) {
            if (err) {
                callback(err, data);
            } else {
                var found = 0;
                // find autoscaling group by tag
                data.AutoScalingGroups.forEach(function (item) {
                    var assocTags = convertToAssocTags(item.Tags);
                    if (assocTags.Environment == Environment
                        && assocTags.Type == 'Magento'
                    ) {
                        found++;
                        callback(null, item.AutoScalingGroupName);
                    }
                });
                if (!found) {
                    callback('No autoscaling group found', null);
                }
            }
        })
    };

    var convertToAssocTags = function (tags) {
        var assocTags = {};
        tags.forEach(function(tag) {
            assocTags[tag.Key] = tag.Value;
        });
        return assocTags;
    };

    var errorExit = function (message, context) {
        var res = {Error: message};
        console.log(res.Error);
        context.fail(res);
    };

    callbackLevel++;

    findElastiCache(function(err, CacheClusterId) {
        if (err) {
            console.log(err, err.stack);
        } else {
            getMetricStatistics('ElastiCache', [{Name: 'CacheClusterId', Value: CacheClusterId}]);
        }
    });

    findDatabase(function(err, DBInstanceIdentifier) {
        if (err) {
            console.log(err, err.stack);
        } else {
            getMetricStatistics('Database', [{Name: 'DBInstanceIdentifier', Value: DBInstanceIdentifier}]);
        }
    });

    findLoadBalancerName(function(err, LoadBalancerName) {
        if (err) {
            console.log(err, err.stack);
        } else {
            ['a', 'b', 'c', 'd', 'e'].forEach(function(value) {
              
              getMetricStatistics('LoadBalancer', [
                {Name: 'TargetGroup', Value: 'targetgroup/hilti-2020092112043978810000003d/9c44cc754c71fe12'},
                {Name: 'AvailabilityZone', Value: 'eu-west-1'+value}
              ]);
                
              getMetricStatistics('LoadBalancer', [
                  {Name: 'TargetGroup', Value: 'targetgroup/hilti-2020092112043978810000003d/9c44cc754c71fe12'},
                  {Name: 'LoadBalancer', Value: LoadBalancerName}
                //    
                ]);
            });

        }
    });

    findAutoScalingGroup(function(err, AutoScalingGroupName) {
        if (err) {
            console.log(err, err.stack);
        } else {
            getMetricStatistics('AutoScalingGroup', [{Name: 'AutoScalingGroupName', Value: AutoScalingGroupName}]);
        }
    });

    callbackLevel--;
};