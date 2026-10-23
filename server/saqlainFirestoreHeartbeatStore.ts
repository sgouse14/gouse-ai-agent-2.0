import type { AgentHeartbeat } from './saqlainAgentHeartbeat.ts';
import { SaqlainFirestoreRestClient, encodeFirestoreValue, type FirestoreWrite } from './saqlainFirestoreRest.ts';

export interface FirestoreHeartbeatStoreOptions {
  client?: SaqlainFirestoreRestClient;
  collection?: string;
}

export class SaqlainFirestoreHeartbeatStore {
  private readonly client: SaqlainFirestoreRestClient;
  private readonly collection: string;

  constructor(options: FirestoreHeartbeatStoreOptions = {}) {
    this.client = options.client ?? new SaqlainFirestoreRestClient();
    this.collection = options.collection ?? process.env.SAQLAIN_FIRESTORE_HEARTBEAT_COLLECTION?.trim() ?? 'saqlainAgentHeartbeats';
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,62}$/.test(this.collection)) {
      throw new Error('Firestore heartbeat collection name is invalid.');
    }
  }

  async record(heartbeat: AgentHeartbeat): Promise<void> {
    if (!heartbeat.agentId?.trim() || !Number.isFinite(Date.parse(heartbeat.lastSeenAt))) {
      throw new Error('Invalid heartbeat record.');
    }
    const name = this.client.documentName(this.collection, heartbeat.agentId);
    const write: FirestoreWrite = {
      update: {
        name,
        fields: {
          agentId: encodeFirestoreValue(heartbeat.agentId),
          lastSeenAt: encodeFirestoreValue(heartbeat.lastSeenAt),
        },
      },
    };
    await this.client.commit([write]);
  }

  async list(): Promise<AgentHeartbeat[]> {
    const documents = await this.client.listDocuments(this.collection);
    return documents.map((document) => {
      if (typeof document.agentId !== 'string' || typeof document.lastSeenAt !== 'string' ||
          !Number.isFinite(Date.parse(document.lastSeenAt))) {
        throw new Error('Firestore heartbeat record failed validation.');
      }
      return { agentId: document.agentId, lastSeenAt: document.lastSeenAt };
    });
  }
}
