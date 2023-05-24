import { LatLngBounds, latLngBounds } from "leaflet";
import { create } from "zustand";

export const useMapStore = create(set => ({
    showSeats: false,
    toggleShowSeats: () => set({ show })),
    seats: [latLngBounds([[0, 0], [0, 0]])],
    addSeat: (seat: LatLngBounds) => set((state: any) => state.seats.push(seat))
}))