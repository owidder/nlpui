const _path = require("path");

const ERPNEXT_PREFIX = "erpnext/";
const AXELOR_PREFIX = "axelor-open-suite/";
const DOLIBARR_PREFIX = "dolibarr/";
const ADEMPIERE_PREFIX = "adempiere/";
const SCHOOL_PREFIX = "school/";
const BOOKS_PREFIX = "books/";

const ERPNEXT_ROOT = "https://github.com/frappe/erpnext/tree/b0cf6195e9efe01150c759483c8ec1c465c746a6/erpnext"
const AXELOR_ROOT = "https://github.com/axelor/axelor-open-suite/tree/924c3a995c67a527b4f054f7136b1961dd8721e9/"
const DOLIBARR_ROOT = "https://github.com/Dolibarr/dolibarr/tree/5070a40fa46d042a3c7879a450331f3eba245c16/";
const ADEMPIERE_ROOT = "https://github.com/adempiere/adempiere/tree/bcd8cb1e1337a4e120aa0c1ad3f002231ee56adb";
const SCHOOL_ROOT = "https://github.com/frappe/school/tree/ec879b12b3ebc8c0e873508b73c83bf9539d033c/";
const BOOKS_ROOT = "https://github.com/frappe/books/tree/5b994522b1d64bef68f751c817dbb9e76e346da3/";

export const srcPathFromPath = (path: string): string => {
    if(path.startsWith(ERPNEXT_PREFIX)) {
        return _path.join(ERPNEXT_ROOT, path.substr(ERPNEXT_PREFIX.length))
    } else if(path.startsWith(AXELOR_PREFIX)) {
        return _path.join(AXELOR_ROOT, path.substr(AXELOR_PREFIX.length))
    } else if(path.startsWith(DOLIBARR_PREFIX)) {
        return _path.join(DOLIBARR_ROOT, path.substr(DOLIBARR_PREFIX.length))
    } else if(path.startsWith(ADEMPIERE_PREFIX)) {
        return _path.join(ADEMPIERE_ROOT, path.substr(ADEMPIERE_PREFIX.length))
    } else if(path.startsWith(SCHOOL_PREFIX)) {
        return _path.join(SCHOOL_ROOT, path.substr(SCHOOL_PREFIX.length))
    } else if(path.startsWith(BOOKS_PREFIX)) {
        return _path.join(BOOKS_ROOT, path.substr(BOOKS_PREFIX.length))
    }

    return _path.join(ADEMPIERE_ROOT, path)
}

