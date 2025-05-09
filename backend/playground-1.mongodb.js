// MongoDB Playground - Final Check Before React Test

use("competitionAppDb");
db.users.findOne({ username: "PeterPan999" });
const submissionIdToCheck = ObjectId("680a598ef3d6cfda72c47a74");

print("Finding submission: " + submissionIdToCheck);
const submission = db.submissions.findOne({ _id: submissionIdToCheck });

if (submission) {
    printjson(submission);
    print("--- CHECK: votedByUsers array ---");
    printjson(submission.votedByUsers);
    print("--- CHECK: voteCount ---");
    print(submission.voteCount);
} else {
    print("Submission NOT FOUND!");
}// Previous commands might be here...
use("competitionAppDb");

// The check script you ran might be here...
// const submissionIdToCheck = ObjectId("680a598ef3d6cfda72c47a74");
// print("Finding submission: " + submissionIdToCheck);
// ... etc ...

// Add the new command here:
db.users.findOne({ username: "PeterPan999" });
// Previous commands are still here...
use("competitionAppDb");

db.users.findOne({ username: "PeterPan999" });


// Paste the new command here:
db.submissions.updateOne(
   { _id: ObjectId("680a598ef3d6cfda72c47a74") }, // Find the specific submission
   {                                               // Perform these updates:
      $set: { voteCount: 0 },                      // Set the vote count to 0
      $pull: { votedByUsers: ObjectId("680a6d28f3d6cfda72c47a80") } // <<-- REMOVE THIS USER ID
   }
);
use("competitionAppDb");
db.competitions.findOne({ _id: ObjectId("680a598ef3d6cfda72c47a72") });
use("competitionAppDb");
db.competitions.findOne({ _id: ObjectId("680a598ef3d6cfda72c47a72") });
db.competitions.findOne({ _id: ObjectId("680a598ef3d6cfda72c47a72") });
// This is the line in server.js that runs for /competitions/b1
db.competitions.findOne({ shortId: "b1" })
db.competitions.deleteMany({})