import type { KpiFragmentType } from "@graphql/fragment/commonFragments";
import { KpiItem, type KpiItemType } from "graph-italia-components";

type KpiProps = {
  data: KpiFragmentType;
};

export const Kpi = ({ data }: KpiProps) => {
  return (
    <div className="containter-xxl py-4 px-0">
      {data.title && (
        <h2 className="mid-caption--lead fw-semibold text-black">
          {data.title}
        </h2>
      )}
      {data.subtitle && <p className="mid-caption--large">{data.subtitle}</p>}
      <div className="row">
        {data.selectKpi?.map((item, index) => {
          return (
            <div key={index} className="col-lg-4 mb-3 mb-lg-0">
              {/* poweredByLabel="" nasconde il footer "Generato con Graph Italia" */}
              <KpiItem data={item as KpiItemType} poweredByLabel="" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
