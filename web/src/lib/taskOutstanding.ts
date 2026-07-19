/**
 * Does this task still require action from the participant it's assigned to?
 *
 * True when nothing has been uploaded yet, or everything uploaded was rejected.
 * A task whose upload is awaiting the lawyer's review is NOT outstanding — the
 * ball is with the lawyer, so we must not chase the client for it.
 *
 * Task status alone is insufficient: rejecting a document leaves the task in
 * 'pending_review' (see workflowRejectDocument), so the documents decide.
 *
 * Shared by the client "what you need to do" banner and the task digest email
 * so the two can never disagree about what a client owes.
 */
export function isOutstandingForParticipant(
    taskStatus: string | undefined,
    documentStatuses: string[]
): boolean {
    if (taskStatus === 'completed') return false;
    if (documentStatuses.length === 0) return true;
    return documentStatuses.every(status => status === 'rejected');
}
