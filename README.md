# Introduction

Building real-time data pipelines is a critical skill for backend and data engineers. In this post, we'll walk through setting up a TypeScript-based Node.js application that simulates stock market data and publishes it to an Apache Kafka broker. We'll also show how to spin up a Kafka broker using Docker and how other applications can consume the simulated data stream.

This works as a good sample for learning how Kafka works in a microservices architecture and how to use it as a message queue for streaming applications.

This tutorial will go through creating:

1. A **TypeScript Node.js server** that simulates stock market data and sends it to a Kafka broker.
2. A **Kafka broker service using Docker**.

---
## Requirements

### Core Software
This software needs to be installed as prerequisites for the services to run locally.
- Nodejs (version 22.15.0^)
- Docker (any modern version)
- Postgresql (version 17.4.0^)

### Dev Dependancies
- @types/node (version 22.15.3^)
- @types/pg (version 8.11.14^)
- typescript (version 5.8.3^)

### Node Modules
- dotenv (version 16.5.0^)
- kafkajs (version 2.2.4^)
- pg (version 8.15.6^)
- ts-node (version 10.9.2^)

# Creating the Historical Database

Ideally, we would like a way to save any historical data for our theoretical Stock Market service, and Postgresql provides an ideal why to do just that; in a way which is easily integrated with Nodejs and Typescript. Once you've installed Postgresql on your device of choice, follow these steps to prepare it for the Ticker service to write to.

1. Ensure Postgresql is running as a service on your device of choice.
2. Launch pgAdmin or your database browser of choice and create a new database called 'market'.

This database will automatically be populated by the Stock Ticker Service.

# Creating the Kafka Broker Service

Apache Kafka is a high-performance system for handling real-time streams of data. Think of it as a central hub where different applications can send and receive messages — like stock updates, logs, or sensor data — all in real time.

It’s useful because it’s fast, scalable, and reliable. Kafka can handle massive amounts of data without slowing down, keeps messages safe even if parts of the system fail, and lets producers and consumers work independently, making it easy to build flexible and loosely coupled systems.

Following these steps below are one of the quickest ways to get your own broker up and running!

1. Download the Apache Kafka docker image from the official Apache Kafka website. You can also run the following;
```
docker pull apache/kafka:4.0.0
```
2. Run Apache Kafka instance on port 9092 by running;
```
docker run -p 9092:9092 apache/kafka:4.0.0
```
3. Create the 'stock-ticker-topic' topic by running the following;
```
docker exec -i YOUR_DOCKER_CONTAINER_NAME './opt/kafka/bin/kafka-topics.sh --create --topic stock-ticker-topic --partitions 1 --bootstrap-server localhost:9092'
```
Your Kafka service should now be running on port 9092.

# Setup (Stock Ticker Service)

1. Clone a copy of the application from github. This can be done in the git command line;
```
git clone https://github.com/MatthewBryanCC/apache-kafka-stock-market-example.git
```
2. Install all the dependencies for the project;
```
npm install
```
3. Edit the config.json and .env files to your needs.
4. Build the application;
```
npm run build
```
5. Run the application;
```
npm run run
```

# How the Stock Ticker Serivce Communicates

The large majority of the Stock Ticker Service program is typical typescript flavoured javascript. It is simply a class which creates random stock data every second, and updates the broker with this informtion each second, and saving it every 10 seconds. As such, the main important component is its communication with the Kafka broker service.

In our github example, this all occurs within the **kafka-service.ts** file. It contains four main components:

- **KafkaService (constructor)**
```
try {
    this.kafka = new Kafka({
        clientId: 'stock-ticker-service',
        brokers: [KAFKA_BROKER_ADDRESS],
        logLevel: logLevel.DEBUG,
    });
    this.producer = this.kafka.producer();
    this.connect();
} catch (error) {
    console.error("Error initializing Kafka producer:", error);
    this.disconnect();
}
```
This constructor creates the main Kafkajs object which enables communication to the Kafka Broker. It also defines this application as a *producer*. **Producers** send information to an Apache Kafka broker, which can then be read by consumers of the broker's service. The ensure that this constructor actually connects, the **"KAFKA_BROKER_ADDRESS"** MUST be set within the .env file before building the application.

- **KafkaService.connect()**
```
try {
    await this.producer.connect();
    console.log("[Kafka Service]: Kafka producer connected to broker:", KAFKA_BROKER_ADDRESS);
    return true;
} catch (error) {
    console.error("Error connecting Kafka producer:", error);
    return false;
} 
```
This connect function initiates the connect to the Kafka broker.

- **KafkaService.disconnect()**
```
try {
    await this.producer.disconnect();
    console.log("[Kafka Service]: Kafka producer disconnected from broker:", KAFKA_BROKER_ADDRESS);
    return true;
} catch (error) {   
    console.error("Error disconnecting Kafka producer:", error);
    return false;
}
```
Expectedly, this disconnects communication to the Kafka service.

- **KafkaService.sendMessage()**
```
try {
    await this.producer.send({
        topic: KAFKA_TOPIC,
        messages: [{ value: message }],
    });
    return true;
} catch (error) {
    console.error("Error sending message to Kafka:", error);
    return false;
}
```
The sendMessage function sends a string of information to the Kafka Broker. In the sample application, the stock data is serialised to JSON information and then send as the message value.

Here is a view of the entire class put together
```
import {Kafka, logLevel} from 'kafkajs';
import appConfig from './config.json' with { "type": "json"};

const KAFKA_BROKER_ADDRESS = process.env.KAFKA_BROKER_ADDRESS || 'localhost:9092';
const KAFKA_TOPIC = process.env.KAFKA_TOPIC || 'stock-ticker-topic';

export class KafkaService {
    private kafka: Kafka;
    private producer: any;

    /**
     * Initializes the Kafka producer and connects to the broker.
     * @constructor
     */
    constructor() {
        try {
            if( appConfig.OUTPUT_INFO ) console.log("[Kafka Service]: Initializing Kafka producer...");
            let level : logLevel = appConfig.DEBUG_MODE ? logLevel.DEBUG : logLevel.NOTHING;
            this.kafka = new Kafka({
                clientId: 'stock-ticker-service',
                brokers: [KAFKA_BROKER_ADDRESS],
                logLevel: level,
            });
            this.producer = this.kafka.producer();
            this.connect();
            if( appConfig.OUTPUT_INFO ) console.log("[Kafka Service]: Kafka producer initialized and connected to broker:", KAFKA_BROKER_ADDRESS);
        } catch (error) {
            console.error("Error initializing Kafka producer:", error);
            this.disconnect();
        }
    }

    /**
     * Connects the Kafka producer to the broker.
     * @returns {Promise<boolean>} - A promise that resolves when the producer is connected.
     */
    async connect() : Promise<boolean> {
        try {
            await this.producer.connect();
            if( appConfig.OUTPUT_INFO ) console.log("[Kafka Service]: Kafka producer connected to broker:", KAFKA_BROKER_ADDRESS);
            return true;
        } catch (error) {
            console.error("Error connecting Kafka producer:", error);
            return false;
        } 
    }

    /**
     * Disconnects the Kafka producer from the broker.
     * @returns {Promise<boolean>} - A promise that resolves when the producer is disconnected.
     */
    async disconnect() : Promise<boolean> {
        try {
            await this.producer.disconnect();
            if( appConfig.OUTPUT_INFO ) console.log("[Kafka Service]: Kafka producer disconnected from broker:", KAFKA_BROKER_ADDRESS);
            return true;
        } catch (error) {   
            console.error("Error disconnecting Kafka producer:", error);
            return false;
        }
    }

    /**
     * Sends a message to the Kafka topic.
     * @param message - The message to be sent to the Kafka topic.
     * @returns {Promise<boolean>} - A promise that resolves to true if the message was sent successfully, false otherwise.
     */
    async sendMessage(message: string) : Promise<boolean> {
        try {
            await this.producer.send({
                topic: KAFKA_TOPIC,
                messages: [{ value: message }],
            });
            return true;
        } catch (error) {
            if( appConfig.DEBUG_MODE ) {
                console.error("Error sending message to Kafka:", error);
            } else if ( appConfig.OUTPUT_INFO ) {
                console.log("[Kafka Service]: Error sending message to Kafka:!");
            }
            return false;
        }
    }

}

```

Any application can now connect to your computer's public IPv4 via port 9092 as a consumer in any language which supports kafka consumers.

---
# Conclusion
You’ve successfully built a stock market simulator using TypeScript and Kafka. With Kafka running in Docker, and your producer and consumer written in TypeScript, this architecture is both scalable and production-ready. You can now extend the application to persist messages to PostgreSQL or expose data via an API.

This setup serves as a robust foundation for learning event-driven architectures and real-time systems.