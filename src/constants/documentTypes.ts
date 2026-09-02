export interface DocumentTypeOption {
  value: string;
  label: string;
}

/**
 * Debe coincidir con los códigos sembrados en la API (tabla tipo_documento
 * / TipoDocumentoSeeder de playboss-api). Si se agrega un tipo nuevo allá,
 * agregarlo también aquí.
 */
export const DOCUMENT_TYPES: DocumentTypeOption[] = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'TI', label: 'Tarjeta de identidad' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'NIT', label: 'NIT' },
];
