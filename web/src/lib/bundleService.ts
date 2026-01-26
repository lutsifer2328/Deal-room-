import JSZip from 'jszip';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { Deal, Task, User, DealDocument } from './types';

// In a real app, this would fetch the actual file BLOB from Supabase Storage
// For this mock, we will generate dummy text files or use a placeholder PDF
async function fetchDocumentBlob(url: string): Promise<Blob> {
    // Mock: Return a simple text file pretending to be a PDF
    const mockContent = `This is a mock content for file at ${url}. Verified by Agenzia.`;
    return new Blob([mockContent], { type: 'application/pdf' });
}

export const BundleService = {
    async generateBundle(deal: Deal, tasks: Task[], users: Record<string, User>) {
        const zip = new JSZip();
        const folderName = `Agenzia_Deal_${deal.id}`;
        const root = zip.folder(folderName);

        if (!root) throw new Error("Failed to create zip folder");

        // 1. Filter Released Documents
        const releasedDocs: { task: Task, doc: DealDocument }[] = [];
        tasks.filter(t => t.dealId === deal.id).forEach(t => {
            t.documents.forEach(d => {
                if (d.status === 'released') {
                    releasedDocs.push({ task: t, doc: d });
                }
            });
        });

        if (releasedDocs.length === 0) {
            alert("No released documents to export.");
            return;
        }

        // 2. Add Documents to Zip
        for (const item of releasedDocs) {
            // Organize by Role (Buyer/Seller) -> Task Title
            const roleFolder = item.task.assignedTo === 'buyer' ? 'Buyer Documents' : 'Seller Documents';
            const fileName = `${item.task.title_en.replace(/[^a-z0-9]/gi, '_')}_${item.doc.id}.txt`; // Using .txt for mock

            try {
                const blob = await fetchDocumentBlob(item.doc.url);
                root.folder(roleFolder)?.file(fileName, blob);
            } catch (e) {
                console.error("Failed to add file", e);
            }
        }

        // 3. Generate Index PDF
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(11, 28, 72); // Midnight Blue
        doc.text("Agenzia Deal Room", 20, 20);

        doc.setFontSize(16);
        doc.text("Transaction Index / Notary Bundle", 20, 30);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Deal ID: ${deal.id}`, 20, 40);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
        doc.text(`Title: ${deal.title}`, 20, 50);

        // List
        let y = 70;
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("Included Documents:", 20, 60);

        releasedDocs.forEach((item, index) => {
            const line = `${index + 1}. [${item.task.assignedTo.toUpperCase()}] ${item.doc.title_en} (ID: ${item.doc.id})`;

            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            doc.text(line, 20, y);
            y += 10;

            // Add metadata line
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(`   Verified: ${item.doc.verifiedAt || 'N/A'} | Uploaded by: ${users[item.doc.uploadedBy]?.name || item.doc.uploadedBy}`, 20, y - 4);
            doc.setFontSize(12);
            doc.setTextColor(0);
        });

        // Add Index to Zip
        const indexBlob = doc.output('blob');
        root.file("00_INDEX.pdf", indexBlob);

        // 4. Download
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${folderName}.zip`);
    }
};
