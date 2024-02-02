/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { ROUTES_PATH } from "../constants/routes.js";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockedStore from "../__mocks__/store.js";

// Mock the store for testing purposes
jest.mock("../app/Store", () => mockedStore);

let newBill, onNavigate;

beforeEach(() => {
  document.body.innerHTML = NewBillUI();
  localStorage.setItem(
    "user",
    JSON.stringify({ type: "Employee", email: "a@a" }),
  );
  onNavigate = jest.fn();
  newBill = new NewBill({
    document,
    onNavigate,
    store: mockedStore,
    localStorage: window.localStorage,
  });
});

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
});

// Main test suite for NewBill functionality
describe("Given I am an employee", () => {
  // Testing file change detection on NewBill page
  describe("When I am on NewBill Page", () => {
    test("Then it should detect change on file input", async () => {
      // Mock the handleChangeFile function to test file change
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const imageInput = screen.getByTestId("file");

      // Check inital state of fileUrl, fileName and billId
      expect(newBill.fileUrl).toBeNull();
      expect(newBill.fileName).toBeNull();
      expect(newBill.billId).toBeNull();
      expect(newBill.fileName).toBeFalsy();

      // Add event listener and trigger file change event
      imageInput.addEventListener("change", handleChangeFile);
      const file = new File(["invoice"], "fichier.png", { type: "image/png" });
      await fireEvent.change(imageInput, {
        target: {
          files: [file],
        },
      });
      // Check if the file change event was triggered
      expect(handleChangeFile).toHaveBeenCalled();

      // Check if the fileUrl, fileName and billId are updated
      expect(newBill.fileUrl).not.toBeNull();
      expect(newBill.fileName).not.toBeNull();
    });
  });

  // Testing for error message display on uploading non-allowed file format
  describe("When I am on NewBill Page and upload a non-allowed file", () => {
    test("Then the error message should be displayed", () => {
      // Mock handleChangeFile function to test error message display
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const fileInput = screen.getByTestId("file");
      const errorMessage = document.getElementById("file-error-message");
      fileInput.addEventListener("change", handleChangeFile);

      // Simulate file upload with non-allowed file format
      const file = new File(["invoice"], "fichier.pdf", {
        type: "application/pdf",
      });
      fireEvent.change(fileInput, {
        target: {
          files: [file],
        },
      });

      // Check if the error message is displayed
      expect(errorMessage.style.display).toBe("block");
      expect(errorMessage.textContent).toBe(
        "Seuls les formats jpg, jpeg, png sont autorisés.",
      );
      expect(handleChangeFile).toHaveBeenCalled();
    });
  });

  // Testing form submission with valid data
  describe("When I submit the form with valid data", () => {
    test("Then the form should be submitted and navigate to Bills page", () => {
      // Mock the updateBill function to simulate form submission
      jest.spyOn(newBill, "updateBill").mockImplementation(() => {});

      // Fill out the form
      const typeExpense = screen.getByTestId("expense-type");
      const nameExpense = screen.getByTestId("expense-name");
      const dateExpense = screen.getByTestId("datepicker");
      const amountExpense = screen.getByTestId("amount");
      const vatExpense = screen.getByTestId("vat");
      const pctExpense = screen.getByTestId("pct");
      const commentArea = screen.getByTestId("commentary");

      fireEvent.change(typeExpense, { target: { value: "Transports" } });
      fireEvent.change(nameExpense, { target: { value: "Billet" } });
      fireEvent.change(dateExpense, { target: { value: "2024-02-02" } });
      fireEvent.change(amountExpense, { target: { value: "200" } });
      fireEvent.change(vatExpense, { target: { value: "20" } });
      fireEvent.change(pctExpense, { target: { value: "20" } });
      fireEvent.change(commentArea, { target: { value: "Commentaire" } });

      // Simulate form submission
      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);

      // Check the form submission process
      expect(newBill.updateBill).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });
  });

  // Testing the bill update functionality
  describe("When I update a bill", () => {
    test("Then the bill should be updated and navigate to Bills page", async () => {
      // Mocking the store's bills().update function to simulate the update operation
      const updateSpy = jest
        .spyOn(mockedStore.bills(), "update")
        .mockResolvedValueOnce({});

      // Create bill object to be updated
      const bill = {
        id: "azerty",
        type: "Transports",
        name: "Billet",
        amount: "200",
        date: "2024-02-02",
        vat: "20",
        pct: "20",
        commentary: "Commentaire",
        fileUrl: "url",
        fileName: "fileName",
      };
      newBill.billId = "azerty";

      // Calling updateBill method with the false mocked bill
      await newBill.updateBill(bill);

      // Check if the mockstore updated the new bill
      expect(updateSpy).toHaveBeenCalledWith({
        data: JSON.stringify(bill),
        selector: "azerty",
      });
    });
  });
});
