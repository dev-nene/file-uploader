-- CreateTable
CREATE TABLE "FolderShare" (
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "folderId" INTEGER NOT NULL,

    CONSTRAINT "FolderShare_pkey" PRIMARY KEY ("token")
);

-- AddForeignKey
ALTER TABLE "FolderShare" ADD CONSTRAINT "FolderShare_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
