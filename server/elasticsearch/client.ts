import { Client } from '@elastic/elasticsearch';

class ElasticsearchClient {
  private static instance: ElasticsearchClient;
  private client: Client;

  private constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth: process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD ? {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD
      } : undefined,
      requestTimeout: 30000,
      maxRetries: 3,
    });
  }

  public static getInstance(): ElasticsearchClient {
    if (!ElasticsearchClient.instance) {
      ElasticsearchClient.instance = new ElasticsearchClient();
    }
    return ElasticsearchClient.instance;
  }

  public getClient(): Client {
    return this.client;
  }

  public async ping(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      console.error('Elasticsearch ping failed:', error);
      return false;
    }
  }

  public async createIndex(index: string, mapping: any): Promise<boolean> {
    try {
      const exists = await this.client.indices.exists({ index });
      if (!exists) {
        await this.client.indices.create({
          index,
          body: {
            mappings: mapping,
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
            }
          }
        });
        console.log(`Created index: ${index}`);
      }
      return true;
    } catch (error) {
      console.error(`Failed to create index ${index}:`, error);
      return false;
    }
  }
}

export const elasticsearchClient = ElasticsearchClient.getInstance();
export const esClient = elasticsearchClient.getClient();
