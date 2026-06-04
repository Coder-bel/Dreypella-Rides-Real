import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const cities = ["Lagos", "Ibadan", "Ogbomoso", "Iseyin", "Oyo"];
const routeOptions = cities.flatMap((from) =>
  cities.filter((to) => to !== from).map((to) => `${from} → ${to}`)
);

const defaultPickupPoints = [
  "LAUTECH Gate", "Under G", "General Hospital Ogbomoso", "Aaje Junction",
  "Ogbomoso Garage", "Iseyin Market", "Oyo Town Hall", "Ibadan Ojoo", "Lagos Ojota",
];

type Trip = {
  id: string;
  route: string;
  travel_date: string;
  departure_time: string;
  price: number;
  available_seats: number;
  pickup_points: string[];
  is_active: boolean;
  created_at: string;
};

type TripForm = {
  route: string;
  travel_date: string;
  departure_time: string;
  price: number;
  available_seats: number;
  pickup_points: string[];
  is_active: boolean;
};

const emptyForm: TripForm = {
  route: "",
  travel_date: "",
  departure_time: "07:00",
  price: 2000,
  available_seats: 14,
  pickup_points: [],
  is_active: true,
};

const TripsManager = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TripForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [customPickup, setCustomPickup] = useState("");

  const fetchTrips = async () => {
    // Admin needs to see all trips including inactive - use a direct query
    const { data } = await supabase.from("trips").select("*").order("travel_date", { ascending: true });
    if (data) setTrips(data as Trip[]);
  };

  useEffect(() => { fetchTrips(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("trips-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, () => fetchTrips())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (trip: Trip) => {
    setEditingId(trip.id);
    setForm({
      route: trip.route,
      travel_date: trip.travel_date,
      departure_time: trip.departure_time,
      price: trip.price,
      available_seats: trip.available_seats,
      pickup_points: trip.pickup_points || [],
      is_active: trip.is_active,
    });
    setShowForm(true);
  };

  const togglePickup = (point: string) => {
    setForm((prev) => ({
      ...prev,
      pickup_points: prev.pickup_points.includes(point)
        ? prev.pickup_points.filter((p) => p !== point)
        : [...prev.pickup_points, point],
    }));
  };

  const addCustomPickup = () => {
    if (customPickup.trim() && !form.pickup_points.includes(customPickup.trim())) {
      setForm((prev) => ({ ...prev, pickup_points: [...prev.pickup_points, customPickup.trim()] }));
      setCustomPickup("");
    }
  };

  const handleSave = async () => {
    if (!form.route || !form.travel_date || !form.departure_time) return;
    setSaving(true);

    if (editingId) {
      await supabase.from("trips").update(form).eq("id", editingId);
    } else {
      await supabase.from("trips").insert(form);
    }

    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchTrips();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from("trips").delete().eq("id", id);
    setDeleting(null);
    fetchTrips();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("trips").update({ is_active: !current }).eq("id", id);
    fetchTrips();
  };

  return (
    <div className="space-y-4">
      {/* Header + Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-base flex items-center gap-2">
          <Clock size={18} className="text-[#C8102E]" /> Trip Schedules
        </h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C8102E] text-white text-xs font-medium hover:bg-[#a00d24] transition-colors"
        >
          <Plus size={14} /> Add Trip
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">{editingId ? "Edit Trip" : "New Trip"}</h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/60 mb-1 block">Route</label>
              <select
                value={form.route}
                onChange={(e) => setForm({ ...form, route: e.target.value })}
                className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/20 outline-none"
              >
                <option value="" className="bg-[#001F3F]">Select route</option>
                {routeOptions.map((r) => (
                  <option key={r} value={r} className="bg-[#001F3F]">{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/60 mb-1 block">Travel Date</label>
              <input
                type="date"
                value={form.travel_date}
                onChange={(e) => setForm({ ...form, travel_date: e.target.value })}
                className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/20 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-white/60 mb-1 block">Departure Time</label>
              <input
                type="time"
                value={form.departure_time}
                onChange={(e) => setForm({ ...form, departure_time: e.target.value })}
                className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/20 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-white/60 mb-1 block">Price (₦)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/20 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-white/60 mb-1 block">Available Seats</label>
              <input
                type="number"
                value={form.available_seats}
                onChange={(e) => setForm({ ...form, available_seats: Number(e.target.value) })}
                className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/20 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded"
              />
              <label className="text-xs text-white/60">Active (visible to users)</label>
            </div>
          </div>

          {/* Pickup Points */}
          <div>
            <label className="text-xs text-white/60 mb-2 block flex items-center gap-1">
              <MapPin size={12} /> Pickup Points
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {defaultPickupPoints.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePickup(p)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    form.pickup_points.includes(p)
                      ? "bg-[#C8102E] border-[#C8102E] text-white"
                      : "bg-white/5 border-white/20 text-white/60 hover:border-white/40"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {/* Custom pickup points that aren't in defaults */}
            {form.pickup_points
              .filter((p) => !defaultPickupPoints.includes(p))
              .map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#C8102E] border border-[#C8102E] text-white mr-2 mb-2"
                >
                  {p}
                  <button onClick={() => togglePickup(p)} className="hover:text-white/70">
                    <X size={10} />
                  </button>
                </span>
              ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={customPickup}
                onChange={(e) => setCustomPickup(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomPickup())}
                placeholder="Add custom pickup point..."
                className="flex-1 bg-white/10 text-white text-xs rounded-lg px-3 py-1.5 border border-white/20 outline-none"
              />
              <button
                type="button"
                onClick={addCustomPickup}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !form.route || !form.travel_date}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#C8102E] text-white text-sm font-medium hover:bg-[#a00d24] transition-colors disabled:opacity-50"
          >
            <Save size={14} /> {saving ? "Saving..." : editingId ? "Update Trip" : "Create Trip"}
          </button>
        </div>
      )}

      {/* Trips Table */}
      {trips.length === 0 ? (
        <div className="bg-white/5 rounded-xl border border-white/10 p-6 text-center">
          <Clock size={32} className="mx-auto text-white/30 mb-3" />
          <p className="text-sm text-white/40">No trips yet. Click "Add Trip" to create one.</p>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/60">Route</TableHead>
                  <TableHead className="text-white/60">Date</TableHead>
                  <TableHead className="text-white/60">Time</TableHead>
                  <TableHead className="text-white/60">Price</TableHead>
                  <TableHead className="text-white/60">Seats</TableHead>
                  <TableHead className="text-white/60">Pickups</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-white/60">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip) => (
                  <TableRow key={trip.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-white font-medium text-xs">{trip.route}</TableCell>
                    <TableCell className="text-white/70 text-xs">{trip.travel_date}</TableCell>
                    <TableCell className="text-white/70 text-xs">{trip.departure_time}</TableCell>
                    <TableCell className="text-white/70 text-xs">₦{trip.price.toLocaleString()}</TableCell>
                    <TableCell className="text-white/70 text-xs">{trip.available_seats}</TableCell>
                    <TableCell className="text-white/70 text-xs max-w-[150px]">
                      <span className="truncate block">{(trip.pickup_points || []).join(", ") || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleActive(trip.id, trip.is_active)}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          trip.is_active
                            ? "bg-green-500/15 text-green-400"
                            : "bg-white/10 text-white/40"
                        }`}
                      >
                        {trip.is_active ? "Active" : "Inactive"}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(trip)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(trip.id)}
                          disabled={deleting === trip.id}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripsManager;
