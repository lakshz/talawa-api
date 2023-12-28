import { Types } from "mongoose";
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { disconnect, connect } from "../../helpers/db";
import { addUserCustomData } from "../../../src/resolvers/Mutation/addUserCustomData";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  TRANSACTION_LOG_TYPES,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { TransactionLog } from "../../../src/models";
import { wait } from "./acceptAdmin.spec";

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestUserAndOrganization();
  testUser = resultArray[0];
  testOrganization = resultArray[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers => Mutation => removeOrganizationCustomField", () => {
  it("should add custom data for a user in an organization", async () => {
    const args = {
      organizationId: testOrganization?._id.toString(),
      dataName: "testDataName",
      dataValue: "testDataValue",
    };
    const context = { userId: testUser?._id };

    const customDataDoc = await addUserCustomData?.({}, args, context);

    expect(customDataDoc?.values).toHaveProperty(args.dataName, args.dataValue);
    expect(customDataDoc?.userId.toString()).toBe(testUser?._id.toString());
    expect(customDataDoc?.organizationId.toString()).toBe(
      testOrganization?._id.toString()
    );
    expect(customDataDoc?.userId.toString()).toBe(testUser?._id.toString());

    await wait();

    const mostRecentTransaction = await TransactionLog.findOne().sort({
      createdAt: -1,
    });

    expect(mostRecentTransaction).toMatchObject({
      createdBy: testUser?._id,
      type: TRANSACTION_LOG_TYPES.CREATE,
      modelName: "UserCustomData",
    });
  });

  it("should throw an error if the current user is not found", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const args = {
      organizationId: testOrganization?._id.toString(),
      dataName: "testDataName",
      dataValue: "testDataValue",
    };

    const context = { userId: Types.ObjectId().toString() };

    try {
      await addUserCustomData?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it("should throw an error if the organization is not found", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const args = {
      organizationId: Types.ObjectId().toString(),
      dataName: "testDataName",
      dataValue: "testDataValue",
    };

    const context = { userId: testUser?._id };

    try {
      await addUserCustomData?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE
      );
      expect(error.message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });
});
