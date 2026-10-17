import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFRadioGroup,
  type PDFField,
} from 'pdf-lib';

export type FormFieldType = 'text' | 'checkbox' | 'dropdown' | 'radio' | 'button' | 'unknown';

export interface FormFieldInfo {
  name: string;
  type: FormFieldType;
  value: string | boolean | string[] | null;
  options?: string[];
  isReadOnly: boolean;
  isRequired: boolean;
}

/**
 * Checks whether a PDF document contains interactive AcroForm fields.
 */
export async function hasFormFields(pdfBytes: Uint8Array): Promise<boolean> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    return fields.length > 0;
  } catch {
    return false;
  }
}

/**
 * Extracts all interactive AcroForm fields with their current values.
 */
export async function extractFormFields(pdfBytes: Uint8Array): Promise<FormFieldInfo[]> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    const result: FormFieldInfo[] = [];

    for (const field of fields) {
      const name = field.getName();
      const isReadOnly = field.isReadOnly();
      const isRequired = field.isRequired();

      if (field instanceof PDFTextField) {
        result.push({
          name,
          type: 'text',
          value: field.getText() || '',
          isReadOnly,
          isRequired,
        });
      } else if (field instanceof PDFCheckBox) {
        result.push({
          name,
          type: 'checkbox',
          value: field.isChecked(),
          isReadOnly,
          isRequired,
        });
      } else if (field instanceof PDFDropdown) {
        result.push({
          name,
          type: 'dropdown',
          value: field.getSelected() || [],
          options: field.getOptions() || [],
          isReadOnly,
          isRequired,
        });
      } else if (field instanceof PDFRadioGroup) {
        result.push({
          name,
          type: 'radio',
          value: field.getSelected() || null,
          options: field.getOptions() || [],
          isReadOnly,
          isRequired,
        });
      } else {
        result.push({
          name,
          type: 'unknown',
          value: null,
          isReadOnly,
          isRequired,
        });
      }
    }

    return result;
  } catch (err) {
    console.warn('Failed to parse AcroForm fields:', err);
    return [];
  }
}

/**
 * Fills interactive AcroForm fields and returns the updated PDF bytes.
 * Preserves the form fields so they remain interactive in Adobe Acrobat and other viewers.
 */
export async function fillFormFields(
  pdfBytes: Uint8Array,
  fieldValues: Record<string, string | boolean>
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();

  for (const [name, val] of Object.entries(fieldValues)) {
    try {
      const field: PDFField = form.getField(name);

      if (field instanceof PDFTextField && typeof val === 'string') {
        field.setText(val);
      } else if (field instanceof PDFCheckBox && typeof val === 'boolean') {
        if (val) field.check();
        else field.uncheck();
      } else if (field instanceof PDFDropdown && typeof val === 'string') {
        field.select(val);
      } else if (field instanceof PDFRadioGroup && typeof val === 'string') {
        field.select(val);
      }
    } catch {
      // Ignore non-existent or unfillable fields safely
    }
  }

  return await pdfDoc.save();
}

/**
 * Creates and adds a text field to a PDF page.
 */
export async function addTextFieldToPdf(
  pdfBytes: Uint8Array,
  pageIndex: number,
  fieldName: string,
  rect: { x: number; y: number; width: number; height: number },
  initialValue = ''
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const page = pdfDoc.getPage(pageIndex);

  const textField = form.createTextField(fieldName);
  if (initialValue) {
    textField.setText(initialValue);
  }

  textField.addToPage(page, {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  });

  return await pdfDoc.save();
}
