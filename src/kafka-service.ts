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
