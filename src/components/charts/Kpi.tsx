import type { KpiFragmentType } from "@graphql/fragment/commonFragments";
import { KpiItem, type KpiItemType } from "graph-italia-components";

type KpiProps = {
  data: KpiFragmentType;
};

export const Kpi = ({ data }: KpiProps) => {
  return (
    <div className="containter-xxl py-4 px-0">
      {data.title && (
        <h3 className="mid-caption--lead fw-semibold text-black">
          {data.title}
        </h3>
      )}
      {data.subtitle && <p className="mid-caption--large">{data.subtitle}</p>}
      <div className="row">
        {data.selectKpi?.map((item, index) => {
          return (
            <div key={index} className="col">
              {/* poweredByLabel="" nasconde il footer "Generato con Graph Italia" */}
              <KpiItem data={item as KpiItemType} poweredByLabel="" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
