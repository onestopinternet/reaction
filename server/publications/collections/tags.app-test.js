import { Random } from "meteor/random";
import { expect } from "meteor/practicalmeteor:chai";
import { Factory } from "meteor/dburles:factory";
import { stubs } from "meteor/practicalmeteor:sinon";
import { PublicationCollector } from "meteor/johanbrook:publication-collector";
import * as Collections from "/lib/collections";
import { Reaction } from "/server/api";
import Fixtures from "/server/imports/fixtures";
import { createActiveShop } from "/server/imports/fixtures/shops";

Fixtures();

describe.only("Tags Publication", () => {
  let collector;
  let primaryShop;
  let shop;
  let tags;

  beforeEach(() => {
    collector = new PublicationCollector({ userId: Random.id() });

    primaryShop = createActiveShop();
    shop = Factory.create("shop");

    Collections.Tags.remove({});

    tags = [1, 2, 3].map(() => {
      const tag = createTag({ shopId: primaryShop._id });
      Collections.Tags.insert(tag);
      return tag;
    });
  });

  after(() => {
    stubs.restoreAll();
  });

  it("ensures our test is set up properly", () => {
    expect(primaryShop._id).to.not.equal(shop._id);
  });

  it("fetches the list of Tags", (done) => {
    collector.collect("Tags", (collections) => {
      const collectionTags = collections.Tags;

      // .sort().join(",") to help with equality testing
      expect(collectionTags.map((t) => t.name).sort().join(","))
        .to.equal(tags.map((t) => t.name).sort().join(","));

      done();
    });
  });

  it("scopes the list of Tags to the current merchant shop", (done) => {
    // create a tag for a Merchant Shop
    const tag = createTag({ shopId: shop._id });
    Collections.Tags.insert(tag);

    const getShopIdpSpy = stubs.create("getShopIdpSpy", Reaction, "getShopId");
    getShopIdpSpy.returns(shop._id);

    collector.collect("Tags", (collections) => {
      const collectionTags = collections.Tags;

      expect(collectionTags.length).to.equal(1);
      expect(collectionTags[0].name).to.equal(tag.name);

      done();
    });
  });

  function randomString() {
    return new Date().getTime().toString();
  }

  function createTag(tagData = {}) {
    return Object.assign({
      name: randomString(),
      slug: randomString(),
      isTopLevel: true
    }, tagData);
  }
});
