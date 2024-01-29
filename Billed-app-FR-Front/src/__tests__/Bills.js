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
import mockStore from "../__mocks__/store.js";

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

  describe('When I called getBills', () => {
    test('It should fetch bills from the store', async () => {
      // Mock the bills function
      mockedBills.bills = jest.fn().mockReturnValue({
        list: jest.fn().mockResolvedValue([{}, {}, {}, {}]),
      });

      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockedBills,
        localStorage: window.localStorage
      });
      await billsContainer.getBills();

      // Check if the bills function has been called
      expect(mockedBills.bills).toHaveBeenCalled();

      const billsFromStore = await mockedBills.bills().list();
      expect(billsFromStore).toBeTruthy();
      expect(billsFromStore.length).toBe(4);
    });

    test('It should handle empty list of bills from the store', async () => {
      // Mock the bills function to return an empty array
      mockedBills.bills = jest.fn().mockReturnValue({
        list: jest.fn().mockResolvedValue([]),
      });

      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockedBills,
        localStorage: window.localStorage
      });
      const bills = await billsContainer.getBills();

      expect(bills).toEqual([]);
    });

    test('It should handle errors during bills fetch', async () => {
      // Mock the bills function to throw an error
      const errorMocked = new Error('Fake error');
      const mockedStoreWithError = {
        bills: jest.fn(() => ({
          list: jest.fn(() => Promise.reject(errorMocked))
        }))
      }

      const billsContainer = new Bills({document, onNavigate: jest.fn(), store: mockedStoreWithError, localStorage: window.localStorage});

      // Check if the error is handled
      try {
        await billsContainer.getBills();
      } catch (error) {
        expect(error).toBe(errorMocked);
      }
    });

    test('It should handle corrupted date data', async () => {
      const mockFormatDate = jest.fn(() => {
        if (typeof jest.fn().mockRejectedValue === 'function') {
          return jest.fn().mockRejectedValue(new Error('Invalid date format'));
        } else {
          throw new Error('Invalid date format');
        }
      });

      // Mock the store
      const mockStore = {
        bills: jest.fn(() => ({
          list: jest.fn(() => Promise.resolve([
            {
              date: 'invalid-date-format'
            }
          ]))
        }))
      }

      mockFormatDate.mockReturnValue('invalid-date-format');

      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage
      });
      const bills = await billsContainer.getBills();

      expect(bills[0].date).toBe('invalid-date-format')
    });
  })

  describe("When an error occurs on API", () => {

    test('should handle 404 error', async () => {
      const mockedBills = {
        bills: jest.fn().mockReturnValue({
          list: jest.fn().mockRejectedValue({ status: 404 }),
        }),
      };

      const billsContainer = new Bills({
        document: document,
        onNavigate: jest.fn(),
        store: mockedBills,
        localStorage: window.localStorage,
      });

      await expect(billsContainer.getBills()).rejects.toEqual({ status: 404 });
    });

    test('should handle 500 error', async () => {
      const mockedBills = {
        bills: jest.fn().mockReturnValue({
          list: jest.fn().mockRejectedValue({ status: 500 }),
        }),
      };

      const billsContainer = new Bills({
        document: document,
        onNavigate: jest.fn(),
        store: mockedBills,
        localStorage: window.localStorage,
      });

      await expect(billsContainer.getBills()).rejects.toEqual({ status: 500 });
    });
  });
});
