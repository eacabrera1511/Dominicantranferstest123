import { supabase } from './supabase';

export interface SyncResult {
  success: boolean;
  recordsSynced: number;
  error?: string;
}

export class AvailabilitySyncService {
  static async syncAvailability(
    partnerId: string,
    connectionId: string,
    apiEndpoint: string,
    apiKey: string
  ): Promise<SyncResult> {
    const startTime = new Date().toISOString();

    try {
      const availabilityData = await this.fetchAvailabilityFromAPI(
        apiEndpoint,
        apiKey
      );

      let recordsSynced = 0;

      for (const item of availabilityData) {
        const record = {
          partner_id: partnerId,
          resource_type: item.resourceType,
          resource_id: item.resourceId,
          resource_name: item.resourceName,
          date: item.date,
          available_units: item.availableUnits,
          total_units: item.totalUnits,
          price: item.price,
          updated_via: 'api_sync',
          metadata: item.metadata || {}
        };

        const { error } = await supabase
          .from('availability')
          .upsert(record, {
            onConflict: 'resource_id,date'
          });

        if (!error) {
          recordsSynced++;
        }
      }

      await supabase.from('sync_logs').insert({
        partner_id: partnerId,
        connection_id: connectionId,
        sync_type: 'availability',
        status: 'success',
        records_synced: recordsSynced,
        started_at: startTime,
        completed_at: new Date().toISOString()
      });

      return { success: true, recordsSynced };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await supabase.from('sync_logs').insert({
        partner_id: partnerId,
        connection_id: connectionId,
        sync_type: 'availability',
        status: 'failed',
        records_synced: 0,
        error_message: errorMessage,
        started_at: startTime,
        completed_at: new Date().toISOString()
      });

      return { success: false, recordsSynced: 0, error: errorMessage };
    }
  }

  private static async fetchAvailabilityFromAPI(
    apiEndpoint: string,
    apiKey: string
  ): Promise<any[]> {
    const response = await fetch(`${apiEndpoint}/availability`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.availability || [];
  }

  static async getAvailabilityForResource(
    resourceId: string,
    startDate: string,
    endDate: string
  ) {
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('resource_id', resourceId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (error) {
      console.error('Error fetching availability:', error);
      return [];
    }

    return data || [];
  }

  static async updateAvailability(
    resourceId: string,
    date: string,
    updates: {
      available_units?: number;
      price?: number;
      total_units?: number;
    }
  ) {
    const { error } = await supabase
      .from('availability')
      .update({
        ...updates,
        last_updated_at: new Date().toISOString(),
        updated_via: 'manual'
      })
      .eq('resource_id', resourceId)
      .eq('date', date);

    if (error) {
      console.error('Error updating availability:', error);
      return false;
    }

    return true;
  }

  static async reduceAvailability(
    resourceId: string,
    date: string,
    quantity: number
  ) {
    const { data: current } = await supabase
      .from('availability')
      .select('available_units')
      .eq('resource_id', resourceId)
      .eq('date', date)
      .single();

    if (current && current.available_units >= quantity) {
      const newAvailable = current.available_units - quantity;

      const { error } = await supabase
        .from('availability')
        .update({
          available_units: newAvailable,
          last_updated_at: new Date().toISOString(),
          updated_via: 'booking'
        })
        .eq('resource_id', resourceId)
        .eq('date', date);

      return !error;
    }

    return false;
  }

  static async checkAvailability(
    resourceId: string,
    startDate: string,
    endDate: string,
    requiredUnits: number
  ): Promise<boolean> {
    const availability = await this.getAvailabilityForResource(
      resourceId,
      startDate,
      endDate
    );

    if (availability.length === 0) {
      return false;
    }

    return availability.every(
      record => record.available_units >= requiredUnits
    );
  }

  static async getResourcesWithAvailability(partnerId: string, date: string) {
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('partner_id', partnerId)
      .eq('date', date)
      .gt('available_units', 0);

    if (error) {
      console.error('Error fetching resources with availability:', error);
      return [];
    }

    return data || [];
  }
}

export async function setupAutoSync(partnerId: string) {
  const { data: connections } = await supabase
    .from('partner_api_connections')
    .select('*')
    .eq('partner_id', partnerId)
    .eq('sync_enabled', true)
    .eq('status', 'active');

  if (!connections || connections.length === 0) {
    return;
  }

  for (const connection of connections) {
    const timeSinceLastSync = connection.last_sync_at
      ? Date.now() - new Date(connection.last_sync_at).getTime()
      : Infinity;

    const syncIntervalMs = connection.sync_frequency * 60 * 1000;

    if (timeSinceLastSync >= syncIntervalMs) {
      await AvailabilitySyncService.syncAvailability(
        partnerId,
        connection.id,
        connection.api_endpoint,
        connection.api_key
      );
    }
  }
}
