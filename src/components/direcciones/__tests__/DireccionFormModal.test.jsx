import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, test, expect } from "vitest";

// Mocks for services
vi.mock("../../../src/services/callesService", () => ({
  listCallesActivas: vi
    .fn()
    .mockResolvedValue([{ id: 1, nombre_completo: "Av. Test" }]),
}));

vi.mock("../../../src/services/sectoresService", () => ({
  listSectores: vi
    .fn()
    .mockResolvedValue({ items: [{ id: 10, nombre: "Sector A" }] }),
}));

vi.mock("../../../src/services/cuadrantesService", () => ({
  listCuadrantes: vi.fn().mockResolvedValue({
    items: [
      {
        id: 100,
        codigo: "Q1",
        latitud: -12.046,
        longitud: -77.03,
        ubigeo_code: "040101",
      },
    ],
  }),
  getCuadranteById: vi.fn().mockResolvedValue({
    id: 100,
    latitud: -12.046,
    longitud: -77.03,
    ubigeo_code: "040101",
  }),
}));

vi.mock("../../../src/services/direccionesService", () => ({
  validarDireccion: vi.fn().mockResolvedValue({
    auto_asignado: true,
    sector: { id: 10 },
    cuadrante: { id: 100 },
  }),
}));

import DireccionFormModal from "../DireccionFormModal";

describe("DireccionFormModal - auto-assign behaviour", () => {
  test("auto-fills sector, cuadrante and coordinates when numero municipal is validated", async () => {
    render(
      <DireccionFormModal isOpen={true} onClose={vi.fn()} direccion={null} />
    );

    // Wait for calle select to be populated
    const calleSelect = await screen.findByLabelText(/Calle/i);
    expect(calleSelect).toBeInTheDocument();

    // Choose a calle
    userEvent.selectOptions(calleSelect, "1");

    // Enter número municipal
    const numeroInput = screen.getByLabelText(/Número Municipal/i);
    await userEvent.type(numeroInput, "450");

    // Wait for validation effect to populate sector and cuadrante
    await waitFor(() => {
      const sectorSelect = screen.getByLabelText(/Sector/i);
      const cuadranteSelect = screen.getByLabelText(/Cuadrante/i);
      expect(sectorSelect).toHaveValue("10");
      expect(cuadranteSelect).toHaveValue("100");
    });

    // Confirm lat/long fields are populated from cuadrante
    await waitFor(() => {
      const latInput = screen.getByLabelText(/Latitud/i);
      const lngInput = screen.getByLabelText(/Longitud/i);
      expect(latInput).toHaveValue(-12.046);
      expect(lngInput).toHaveValue(-77.03);
    });
  });

  test("selecting sector loads cuadrantes and selecting cuadrante fills coordinates", async () => {
    render(
      <DireccionFormModal isOpen={true} onClose={vi.fn()} direccion={null} />
    );

    const sectorSelect = await screen.findByLabelText(/Sector/i);
    // Sector list loaded from mock listSectores
    expect(sectorSelect).toBeInTheDocument();

    // Select the sector
    userEvent.selectOptions(sectorSelect, "10");

    // Wait for cuadrante options to be loaded and appear
    const cuadranteSelect = await screen.findByLabelText(/Cuadrante/i);

    await waitFor(() => {
      expect(cuadranteSelect.options.length).toBeGreaterThan(1); // includes placeholder
    });

    // Select cuadrante
    userEvent.selectOptions(cuadranteSelect, "100");

    // Coordinates should populate
    await waitFor(() => {
      expect(screen.getByLabelText(/Latitud/i)).toHaveValue(-12.046);
      expect(screen.getByLabelText(/Longitud/i)).toHaveValue(-77.03);
    });
  });
});
