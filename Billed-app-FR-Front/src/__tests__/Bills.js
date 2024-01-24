/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import router from "../app/Router.js";
import mockedBills from "../__mocks__/store.js";
import Bills from "../containers/Bills.js";

jest.mock("../app/format.js", () => ({
  formatDate: jest.fn(),
  formatStatus: jest.fn(),
}));

// jest.mock('../app/store', () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        }),
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");

      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i,
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    test("Button new bill should have an event listener", () => {
      // Mock navigate function
      const onNavigate = jest.fn();

      // Mock Bills instance
      const billInstance = new Bills({
        document,
        onNavigate,
        store: mockedBills,
        localStorage: window.localStorage,
      });

      // Mock handleClickNewBill function
      billInstance.handleClickNewBill = jest.fn();

      // Retrieve new bill button, and click on it
      const newBillButton = document.querySelector(
        'button[data-testid="btn-new-bill"]',
      );
      expect(newBillButton).toBeDefined();
      newBillButton.click();

      // Check if handleClickNewBill function has been called with the right parameter
      expect(billInstance.onNavigate).toHaveBeenCalledWith(
        ROUTES_PATH["NewBill"],
      );
    });

    test("The eye icon should have an event listener", () => {
      // Mock Jquery modal function
      jQuery.fn.modal = () => {};

      // retrieve all eye icons and get the first one
      const eyeIcon = screen.getAllByTestId("icon-eye")[0];
      expect(eyeIcon).toBeDefined();

      // Mock Bills instance
      const billInstance = new Bills({
        document,
        onNavigate,
        store: mockedBills,
        localStorage: window.localStorage,
      });
      billInstance.handleClickIconEye = jest.fn();

      // Simulate click on the first eye icon and check if handleClickIconEye has been called
      eyeIcon.click();
      expect(billInstance.handleClickIconEye).toHaveBeenCalled();
    });
  });

  describe('', () => {
    test('', () => {
      
    })
  })
});
