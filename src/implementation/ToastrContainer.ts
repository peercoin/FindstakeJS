import { type Ref, ref } from "vue";

function createId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xyz]/g, (char) => {
    const r =
      (window.crypto.getRandomValues(new Uint32Array(1))[0] *
        Math.pow(2, -32) *
        16) |
      0;
    const v = char === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function createToastr(type: string, message: string, timeout: number = 5) {
  const id = createId();
  const toastr = { id: id, message: message, type: type } as Toastr;

  getToastr().allToastrs.value.push(toastr);

  setTimeout(() => {
    close(id);
  }, timeout * 1000);
}

function close(id: string) {
  getToastr().allToastrs.value = getToastr().allToastrs.value.filter(
    (t) => t.id != id
  );
}

const toasters = ref<Array<Toastr>>([]);
const container: ToastrContainer = {
  allToastrs: toasters,
  warning: (message: string) => {
    return createToastr("warning", message);
  },
  error: (message: string) => {
    return createToastr("error", message);
  },
  information: (message: string) => {
    return createToastr("information", message);
  },
  success: (message: string) => {
    return createToastr("success", message);
  },
  close: close,
};

export function getToastr(): ToastrContainer {
  return container;
}

export interface ToastrContainer {
  allToastrs: Ref<Toastr[]>;
  error(message: string): void;
  success(message: string): void;
  warning(message: string): void;
  information(message: string): void;
  close(id: string): void;
}

export interface Toastr {
  id: string;
  message: string;
  type: string;
}
