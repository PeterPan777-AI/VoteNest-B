// MongoDB Playground - Full Code for Vote Removal
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use("competitionAppDb");

// -------------------------------------------------------------
// --- Section to Remove the Vote ---
// This section finds a specific submission and removes a specific user's vote.

// Define the ID of the user whose vote we want to remove.
// This ID ("680a6d28f3d6cfda72c47a80") belongs to PeterPan999.
const userIdToRemove = ObjectId("680a6d28f3d6cfda72c47a80");

// Define the ID of the submission we want to modify.
const submissionIdToUpdate = ObjectId("680a598ef3d6cfda72c47a74");

// The command to update the submission:
// - It finds the submission by its _id.
// - It sets the voteCount field to 0.
// - It removes the userIdToRemove from the votedByUsers array.
print("Attempting to remove vote for user " + userIdToRemove + " from submission " + submissionIdToUpdate);
db.submissions.updateOne(
   { _id: submissionIdToUpdate },
   {
      $set: { voteCount: 0 },
      $pull: { votedByUsers: userIdToRemove }
   }
);
print("Vote removal command finished. Check the result above this message.");
// --- End of Section to Remove the Vote ---
// -------------------------------------------------------------

// You can leave this file like this.
// We only need to run the 'Section to Remove the Vote' above.