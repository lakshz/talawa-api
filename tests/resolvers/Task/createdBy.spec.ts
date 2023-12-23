import "dotenv/config";
import { createdBy as createdByResolver } from "../../../src/resolvers/Task/createdBy";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createAndAssignTestTask, type TestTaskType } from "../../helpers/task";
import type { TestUserType } from "../../helpers/userAndOrg";
import { User } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testTask: TestTaskType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , , , testTask] = await createAndAssignTestTask();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Task -> Creator", () => {
  it(`returns the createdBy user object for parent task`, async () => {
    const parent = testTask!.toObject();

    const createdByPayload = await createdByResolver?.(parent, {}, {});

    const createdByObject = await User.findOne({
      _id: testUser!._id,
    }).lean();

    expect(createdByPayload).toEqual(createdByObject);
  });
});
