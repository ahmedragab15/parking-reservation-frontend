import { createSlice } from "@reduxjs/toolkit";

interface UIState {
    isModalOpen: boolean;
}
const initialState: UIState = {
    isModalOpen: false,
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        openModal: (state) => {
            state.isModalOpen = true;
        },
        closeModal: (state) => {
            state.isModalOpen = false;
        },
    },
});

export const { openModal, closeModal} = uiSlice.actions;
export default uiSlice.reducer;
