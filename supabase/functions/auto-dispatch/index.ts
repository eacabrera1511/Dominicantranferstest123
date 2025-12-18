import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface DispatchRequest {
  booking_id: string;
  preferred_driver_id?: string;
  vehicle_type?: string;
  pickup_datetime?: string;
}

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
  rating: number;
  vehicle_id: string | null;
  current_location: any;
}

interface Vehicle {
  id: string;
  vehicle_type: string;
  status: string;
  capacity: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const dispatchRequest: DispatchRequest = await req.json();

    if (!dispatchRequest.booking_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: booking_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', dispatchRequest.booking_id)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already assigned
    const { data: existingAssignment } = await supabase
      .from('trip_assignments')
      .select('*')
      .eq('booking_id', booking.id)
      .in('status', ['assigned', 'accepted', 'en_route_pickup', 'arrived', 'in_progress'])
      .maybeSingle();

    if (existingAssignment) {
      return new Response(
        JSON.stringify({ 
          error: 'Booking already has an active assignment',
          assignment: existingAssignment,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vehicleType = dispatchRequest.vehicle_type || booking.vehicle_type || 'sedan';
    const pickupTime = dispatchRequest.pickup_datetime || booking.pickup_datetime;

    // Find available vehicles of the requested type
    const { data: availableVehicles } = await supabase
      .from('vehicles')
      .select('*')
      .eq('vehicle_type', vehicleType)
      .eq('status', 'available');

    if (!availableVehicles || availableVehicles.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No available vehicles of the requested type',
          vehicle_type: vehicleType,
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find available drivers
    let driversQuery = supabase
      .from('drivers')
      .select('*')
      .eq('status', 'active');

    // If preferred driver specified, prioritize them
    if (dispatchRequest.preferred_driver_id) {
      const { data: preferredDriver } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', dispatchRequest.preferred_driver_id)
        .eq('status', 'active')
        .maybeSingle();

      if (preferredDriver) {
        // Check if preferred driver is available
        const { data: driverAssignments } = await supabase
          .from('trip_assignments')
          .select('*')
          .eq('driver_id', preferredDriver.id)
          .in('status', ['assigned', 'accepted', 'en_route_pickup', 'arrived', 'in_progress']);

        if (!driverAssignments || driverAssignments.length === 0) {
          // Preferred driver is available
          const selectedVehicle = availableVehicles.find(v => v.id === preferredDriver.vehicle_id) || availableVehicles[0];
          
          const { data: assignment, error: assignmentError } = await supabase
            .from('trip_assignments')
            .insert({
              booking_id: booking.id,
              driver_id: preferredDriver.id,
              vehicle_id: selectedVehicle.id,
              assignment_method: 'auto',
              assigned_by: 'auto-dispatch-system',
              status: 'assigned',
            })
            .select()
            .single();

          if (assignmentError) {
            throw assignmentError;
          }

          await supabase
            .from('bookings')
            .update({ workflow_status: 'assigned' })
            .eq('id', booking.id);

          return new Response(
            JSON.stringify({
              success: true,
              assignment,
              driver: preferredDriver,
              vehicle: selectedVehicle,
              message: 'Booking assigned to preferred driver',
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Auto-assign: Find best available driver
    const { data: availableDrivers } = await driversQuery;

    if (!availableDrivers || availableDrivers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No available drivers' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check which drivers don't have active assignments
    const { data: activeAssignments } = await supabase
      .from('trip_assignments')
      .select('driver_id')
      .in('status', ['assigned', 'accepted', 'en_route_pickup', 'arrived', 'in_progress']);

    const busyDriverIds = new Set((activeAssignments || []).map((a: any) => a.driver_id));
    const freeDrivers = (availableDrivers as Driver[]).filter(d => !busyDriverIds.has(d.id));

    if (freeDrivers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'All drivers are currently busy' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simple scoring: prioritize by rating
    freeDrivers.sort((a, b) => b.rating - a.rating);
    const selectedDriver = freeDrivers[0];

    // Select vehicle
    const selectedVehicle = availableVehicles.find(v => v.id === selectedDriver.vehicle_id) || availableVehicles[0];

    // Create assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('trip_assignments')
      .insert({
        booking_id: booking.id,
        driver_id: selectedDriver.id,
        vehicle_id: selectedVehicle.id,
        assignment_method: 'auto',
        assigned_by: 'auto-dispatch-system',
        status: 'assigned',
        notes: `Auto-assigned to highest-rated available driver (${selectedDriver.rating}/5)`,
      })
      .select()
      .single();

    if (assignmentError) {
      throw assignmentError;
    }

    // Update booking status
    await supabase
      .from('bookings')
      .update({ workflow_status: 'assigned' })
      .eq('id', booking.id);

    // Log the assignment
    await supabase
      .from('trip_logs')
      .insert({
        assignment_id: assignment.id,
        event_type: 'status_change',
        event_data: {
          status: 'assigned',
          driver_name: `${selectedDriver.first_name} ${selectedDriver.last_name}`,
          vehicle_info: selectedVehicle,
          assignment_method: 'auto',
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        assignment,
        driver: selectedDriver,
        vehicle: selectedVehicle,
        message: 'Booking auto-assigned successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in auto-dispatch:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});