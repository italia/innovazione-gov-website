import { getI18n } from "@i18n/microcopy";
import { useId, useState } from "react";
import "./style.scss";
import type { CardMeasureProps } from "./types";

export function CardMeasure({
  title,
  description,
  benefits,
  goalAchieved,
  totalGoal,
  lang,
}: CardMeasureProps) {
  const t = getI18n(lang);
  const [open, setOpen] = useState(false);
  const id = useId();
  const headingId = `measure-heading-${id}`;
  const bodyId = `measure-body-${id}`;
  const isComplete = totalGoal > 0 && goalAchieved >= totalGoal;

  return (
    <div className="accordion-item measure-item bg-transparent">
      <h3 className="accordion-header" id={headingId}>
        <button
          className={`accordion-button measure-button ${open ? "" : "collapsed"}`}
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="measure-heading-content d-flex flex-column flex-lg-row align-items-start align-items-lg-center gap-2 gap-lg-3 pe-3">
            <span className="fw-bold text-primary">{title}</span>
            <span
              className={`badge rounded-pill measure-badge ${
                isComplete
                  ? "measure-badge--complete"
                  : "measure-badge--partial"
              }`}
            >
              {goalAchieved}/{totalGoal} {t["measure.goal"]}
            </span>
          </span>
        </button>
      </h3>

      <div
        id={bodyId}
        className={`accordion-collapse collapse ${open ? "show" : ""}`}
        role="region"
        aria-labelledby={headingId}
      >
        <div className="accordion-body">
          {description && <p className="mb-0">{description}</p>}

          {benefits.length > 0 && (
            <div className="measure-benefits mt-4 p-4">
              <p className="measure-benefits__title text-uppercase fw-semibold mb-3">
                {t["measure.benefits"]}
              </p>
              <ul className="measure-benefits__list list-unstyled mb-0 d-flex flex-column gap-2">
                {benefits.map((benefit, index) => (
                  <li key={index} className="d-flex align-items-start gap-2">
                    <svg
                      className="icon icon-sm icon-primary flex-shrink-0"
                      aria-hidden="true"
                    >
                      <use href="/bsi-svg/sprites.svg#it-check" />
                    </svg>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
