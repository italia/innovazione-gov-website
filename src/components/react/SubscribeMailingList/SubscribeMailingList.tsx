import type { SiteLocale } from "@graphql/types";
import { getI18n } from "@i18n/microcopy";
import { postRequest } from "@utils/apiUtils";
import { useState } from "react";

export type SubscribeProps = {
  idForm: string;
  lang: SiteLocale;
};

const StateClass = Object.freeze({
  START: { className: "" },
  LOADING: { className: "success" },
  SUCCESS: { className: "success" },
  ERROR: { className: "danger" },
});

type SubscribeData = {
  email?: string;
  [key: string]: unknown;
};

export function SubscribeMailingList({ idForm, lang }: SubscribeProps) {
  const t = getI18n(lang);
  const [state, setState] = useState(StateClass.START);
  const [message, setMessage] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const endpoint = import.meta.env.PUBLIC_SENDPORTAL_SUBSCRIBE_URL;
    const data: SubscribeData = {};

    new FormData(e.currentTarget).forEach((value, key) => {
      data[key] = value;
    });

    try {
      setState(StateClass.LOADING);

      await postRequest(endpoint, data);

      setState(StateClass.SUCCESS);
      setMessage(t["subscribe.successText"]);
    } catch (ex) {
      setState(StateClass.ERROR);

      console.error(`Mailing list subscribe error: ${ex}`);
      setMessage(t["subscribe.errorText"]);
    }
  };

  return (
    <>
      <form id={idForm} onSubmit={onSubmit} className="footer-newsletter__form">
        <label className="visually-hidden" htmlFor={`${idForm}_InputMail`}>
          Email
        </label>
        <input
          type="email"
          className="footer-newsletter__input"
          id={`${idForm}_InputMail`}
          placeholder="Email"
          required
          name="email"
        />
        <button
          type="submit"
          className="footer-newsletter__button"
          disabled={state === StateClass.LOADING}
        >
          {state === StateClass.LOADING ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              />
              <span className="visually-hidden">{t["loading"]}</span>
            </>
          ) : (
            <span>{t["subscribe.button"]}</span>
          )}
        </button>
      </form>
      <p
        className="footer-newsletter__feedback"
        style={{
          visibility:
            state === StateClass.SUCCESS || state === StateClass.ERROR
              ? "visible"
              : "hidden",
        }}
        role="alert"
      >
        {message}
      </p>
    </>
  );
}
