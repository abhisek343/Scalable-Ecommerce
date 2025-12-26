// @ts-ignore
import Consul from 'consul';

let consulClient: Consul | null = null;

export interface ServiceRegistration {
    name: string;
    id: string;
    address: string;
    port: number;
    tags?: string[];
    check?: {
        http: string;
        interval: string;
        timeout: string;
    };
}

/**
 * Initialize Consul client
 */
export const initConsul = (): Consul => {
    if (consulClient) {
        return consulClient;
    }

    const consulHost = process.env.CONSUL_HOST || 'localhost';
    const consulPort = parseInt(process.env.CONSUL_PORT || '8500');

    consulClient = new Consul({
        host: consulHost,
        port: consulPort,
        promisify: true
    });

    console.log(`✅ Consul: Connected to ${consulHost}:${consulPort}`);
    return consulClient;
};

/**
 * Register a service with Consul
 */
export const registerService = async (registration: ServiceRegistration): Promise<void> => {
    if (!consulClient) {
        initConsul();
    }

    const serviceDefinition: any = {
        name: registration.name,
        id: registration.id,
        address: registration.address,
        port: registration.port,
        tags: registration.tags || [],
    };

    if (registration.check) {
        serviceDefinition.check = {
            http: registration.check.http,
            interval: registration.check.interval,
            timeout: registration.check.timeout,
            deregistercriticalserviceafter: '1m'
        };
    }

    try {
        await consulClient!.agent.service.register(serviceDefinition);
        console.log(`✅ Consul: Service "${registration.name}" registered with ID "${registration.id}"`);
    } catch (error) {
        console.error(`❌ Consul: Failed to register service "${registration.name}"`, error);
        throw error;
    }
};

/**
 * Deregister a service from Consul
 */
export const deregisterService = async (serviceId: string): Promise<void> => {
    if (!consulClient) {
        return;
    }

    try {
        await consulClient.agent.service.deregister(serviceId);
        console.log(`✅ Consul: Service "${serviceId}" deregistered`);
    } catch (error) {
        console.error(`❌ Consul: Failed to deregister service "${serviceId}"`, error);
    }
};

/**
 * Get healthy instances of a service
 */
export const getServiceInstances = async (serviceName: string): Promise<any[]> => {
    if (!consulClient) {
        initConsul();
    }

    try {
        const result = await consulClient!.health.service({
            service: serviceName,
            passing: true
        });
        return result;
    } catch (error) {
        console.error(`❌ Consul: Failed to get instances for "${serviceName}"`, error);
        return [];
    }
};

/**
 * Get a single healthy instance of a service (for load balancing)
 */
export const getServiceInstance = async (serviceName: string): Promise<{ address: string; port: number } | null> => {
    const instances = await getServiceInstances(serviceName);

    if (instances.length === 0) {
        return null;
    }

    // Simple round-robin: pick random instance
    const instance = instances[Math.floor(Math.random() * instances.length)];

    return {
        address: instance.Service.Address || instance.Node.Address,
        port: instance.Service.Port
    };
};

/**
 * Build service URL from Consul lookup
 */
export const getServiceUrl = async (serviceName: string): Promise<string | null> => {
    const instance = await getServiceInstance(serviceName);

    if (!instance) {
        console.warn(`⚠️ Consul: No healthy instances for "${serviceName}"`);
        return null;
    }

    return `http://${instance.address}:${instance.port}`;
};

/**
 * Watch for service changes
 */
export const watchService = (
    serviceName: string,
    callback: (instances: any[]) => void
): { end: () => void } => {
    if (!consulClient) {
        initConsul();
    }

    const watch = consulClient!.watch({
        method: consulClient!.health.service,
        options: {
            service: serviceName,
            passing: true
        }
    });

    watch.on('change', (data: any) => {
        callback(data);
    });

    watch.on('error', (err: Error) => {
        console.error(`❌ Consul Watch Error for "${serviceName}":`, err);
    });

    return watch;
};

/**
 * Store a key-value in Consul KV
 */
export const setKV = async (key: string, value: string): Promise<void> => {
    if (!consulClient) {
        initConsul();
    }

    await consulClient!.kv.set(key, value);
};

/**
 * Get a value from Consul KV
 */
export const getKV = async (key: string): Promise<string | null> => {
    if (!consulClient) {
        initConsul();
    }

    try {
        const result = await consulClient!.kv.get(key);
        if (result && result.Value) {
            return Buffer.from(result.Value, 'base64').toString();
        }
        return null;
    } catch {
        return null;
    }
};
