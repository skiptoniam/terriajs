import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import CatalogFunctionTraits from "../Traits/CatalogFunctionTraits";
import CatalogMemberMixin from "./CatalogMemberMixin";
import FunctionParameter from "../Models/FunctionParameters/FunctionParameter";
import CatalogFunctionJobMixin from "./CatalogFunctionJobMixin";
import CommonStrata from "../Models/CommonStrata";
import { toJS, runInAction } from "mobx";
import TerriaError from "../Core/TerriaError";
import upsertModelFromJson from "../Models/upsertModelFromJson";
import CatalogMemberFactory from "../Models/CatalogMemberFactory";
const sprintf = require("terriajs-cesium/Source/ThirdParty/sprintf").default;

type CatalogFunctionMixin = Model<CatalogFunctionTraits>;

function CatalogFunctionMixin<T extends Constructor<CatalogFunctionMixin>>(
  Base: T
) {
  abstract class CatalogFunctionMixin extends CatalogMemberMixin(Base) {
    abstract readonly jobType: string;

    async submitJob() {
      try {
        const now = new Date();
        const timestamp = sprintf(
          "%04d-%02d-%02dT%02d:%02d:%02d",
          now.getFullYear(),
          now.getMonth() + 1,
          now.getDate(),
          now.getHours(),
          now.getMinutes(),
          now.getSeconds()
        );

        const newJob = upsertModelFromJson(
          CatalogMemberFactory,
          this.terria,
          this.uniqueId || "",
          undefined,
          CommonStrata.user,
          {
            id: `${this.uniqueId}-${timestamp}`,
            name: `${this.typeName} ${timestamp}`,
            parameters: toJS(this.parameters),
            type: this.jobType
          }
        );

        if (!CatalogFunctionJobMixin.isMixedInto(newJob)) {
          throw `Error creating job catalog item - ${this.jobType} is not a valid jobType`;
        }

        await newJob.loadMetadata();
        await newJob.invoke();

        // Only add model if successfully invokes (doesn't throw exception)
        this.terria.workbench.add(newJob);
        this.terria.catalog.userAddedDataGroup.add(CommonStrata.user, newJob);

        runInAction(() =>
          newJob.setTrait(CommonStrata.user, "refreshEnabled", true)
        );

        return true;
      } catch (error) {
        this.throwInvalidWpsServerError(error);
        return false;
      }
    }

    abstract get functionParameters(): FunctionParameter[];

    throwInvalidWpsServerError(error: string) {
      throw new TerriaError({
        title: `Error submitting ${this.typeName}`,
        message: error
      });
    }

    get hasCatalogFunctionMixin() {
      return true;
    }
  }

  return CatalogFunctionMixin;
}

namespace CatalogFunctionMixin {
  export interface CatalogFunctionMixin
    extends InstanceType<ReturnType<typeof CatalogFunctionMixin>> {}
  export function isMixedInto(model: any): model is CatalogFunctionMixin {
    return model && model.hasCatalogFunctionMixin;
  }
}

export default CatalogFunctionMixin;