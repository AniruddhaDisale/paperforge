import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
  hasFormFields,
  extractFormFields,
  fillFormFields,
  addTextFieldToPdf,
} from '../pdfFormService';

describe('PDF Form Service', () => {
  it('detects and fills form fields in a PDF', async () => {
    // Create a PDF with a text field and checkbox
    const doc = await PDFDocument.create();
    const page = doc.addPage([600, 800]);
    const form = doc.getForm();

    const nameField = form.createTextField('fullName');
    nameField.setText('Original Name');
    nameField.addToPage(page, { x: 50, y: 700, width: 200, height: 30 });

    const agreeBox = form.createCheckBox('agreeTerms');
    agreeBox.addToPage(page, { x: 50, y: 650, width: 20, height: 20 });

    const bytes = await doc.save();

    // Verify detection
    const hasFields = await hasFormFields(bytes);
    expect(hasFields).toBe(true);

    // Verify extraction
    const fields = await extractFormFields(bytes);
    expect(fields).toHaveLength(2);
    expect(fields.find((f) => f.name === 'fullName')?.value).toBe('Original Name');
    expect(fields.find((f) => f.name === 'agreeTerms')?.value).toBe(false);

    // Fill the fields
    const filledBytes = await fillFormFields(bytes, {
      fullName: 'PaperForge User',
      agreeTerms: true,
    });

    const reloadedFields = await extractFormFields(filledBytes);
    expect(reloadedFields.find((f) => f.name === 'fullName')?.value).toBe('PaperForge User');
    expect(reloadedFields.find((f) => f.name === 'agreeTerms')?.value).toBe(true);
  });

  it('adds a new interactive text field to a PDF', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([500, 700]);
    const initialBytes = await doc.save();

    const withFieldBytes = await addTextFieldToPdf(
      initialBytes,
      0,
      'emailAddress',
      { x: 50, y: 500, width: 250, height: 30 },
      'test@paperforge.dev'
    );

    const fields = await extractFormFields(withFieldBytes);
    expect(fields).toHaveLength(1);
    expect(fields[0].name).toBe('emailAddress');
    expect(fields[0].value).toBe('test@paperforge.dev');
  });
});
