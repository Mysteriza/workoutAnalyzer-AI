"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ActivityDetail } from "@/types";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { formatDuration, formatDistance, formatSpeed, formatPace } from "@/utils/strava";
import { getSavedAnalysis } from "@/utils/storage";

interface ExportReportButtonProps {
  activityDetail: ActivityDetail;
  activityName: string;
}

export function ExportDataButton({ activityDetail, activityName }: ExportReportButtonProps) {
  const handleExport = () => {
    const activity = activityDetail.activity;
    const savedAnalysis = getSavedAnalysis(activity.id);
    const analysis = savedAnalysis?.content || null;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let yPos = 0;

    const primaryColor: [number, number, number] = [139, 92, 246];
    const darkGray: [number, number, number] = [50, 50, 50];
    const lightGray: [number, number, number] = [120, 120, 120];
    const bgGray: [number, number, number] = [245, 245, 245];

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("CARDIOKERNEL", margin, 18);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Activity Performance Report", margin, 26);
    
    const dateGenerated = new Date().toLocaleDateString("en-US", { 
      year: "numeric", month: "long", day: "numeric" 
    });
    doc.setFontSize(8);
    doc.text(`Generated: ${dateGenerated}`, pageWidth - margin, 26, { align: "right" });

    yPos = 55;

    doc.setTextColor(...darkGray);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(activityName, margin, yPos);
    
    yPos += 8;
    const activityDate = new Date(activity.start_date_local);
    const dateStr = activityDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...lightGray);
    doc.text(`${dateStr}  •  ${activity.type || activity.sport_type}`, margin, yPos);

    yPos += 15;
    doc.setTextColor(...darkGray);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PERFORMANCE SUMMARY", margin, yPos);
    
    yPos += 3;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, margin + 50, yPos);

    yPos += 8;

    const statsData = [
      [
        { label: "Distance", value: formatDistance(activity.distance), icon: "📍" },
        { label: "Duration", value: formatDuration(activity.moving_time), icon: "⏱️" },
        { label: "Elevation", value: `${activity.total_elevation_gain?.toFixed(0) || 0} m`, icon: "⛰️" },
        { label: "Avg Speed", value: formatSpeed(activity.average_speed || 0), icon: "🚀" },
      ],
      [
        { label: "Avg HR", value: activity.average_heartrate ? `${Math.round(activity.average_heartrate)} bpm` : "N/A", icon: "❤️" },
        { label: "Max HR", value: activity.max_heartrate ? `${Math.round(activity.max_heartrate)} bpm` : "N/A", icon: "💓" },
        { label: "Calories", value: `${activity.calories || 0}`, icon: "🔥" },
        { label: "Elev Range", value: `${activity.elev_low?.toFixed(0) || 0}-${activity.elev_high?.toFixed(0) || 0} m`, icon: "📊" },
      ],
      [
        { label: "Max Speed", value: formatSpeed(activity.max_speed || 0), icon: "⚡" },
        { label: "Kudos", value: `${activity.kudos_count || 0}`, icon: "👍" },
        { label: "Achievements", value: `${activity.achievement_count || 0}`, icon: "🏆" },
        { label: "PRs", value: `${activity.pr_count || 0}`, icon: "🥇" },
      ],
    ];

    const cellWidth = (pageWidth - margin * 2) / 4;
    const cellHeight = 18;

    statsData.forEach((row, rowIndex) => {
      row.forEach((stat, colIndex) => {
        const x = margin + colIndex * cellWidth;
        const y = yPos + rowIndex * cellHeight;
        
        doc.setFillColor(...bgGray);
        doc.roundedRect(x + 1, y, cellWidth - 2, cellHeight - 2, 2, 2, "F");
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...lightGray);
        doc.text(stat.label, x + 5, y + 6);
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryColor);
        doc.text(stat.value, x + 5, y + 13);
      });
    });

    yPos += statsData.length * cellHeight + 10;

    if (activity.gear) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...lightGray);
      doc.text(`Gear: ${activity.gear.nickname || activity.gear.name || "Unknown"}`, margin, yPos);
      yPos += 8;
    }

    if (analysis && analysis.trim().length > 0) {
      yPos += 5;
      
      doc.setTextColor(...darkGray);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("AI PERFORMANCE ANALYSIS", margin, yPos);
      
      yPos += 3;
      doc.setDrawColor(...primaryColor);
      doc.line(margin, yPos, margin + 55, yPos);
      
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...darkGray);
      
      const sections = analysis.split(/(?=##\s)/);
      
      sections.forEach(section => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }

        const headerMatch = section.match(/^##\s*(.+?)(?:\n|$)/);
        if (headerMatch) {
          yPos += 4;
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...primaryColor);
          const headerText = headerMatch[1].replace(/\*\*/g, "").trim();
          doc.text(headerText, margin, yPos);
          yPos += 6;
          
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...darkGray);
        }
        
        const content = section.replace(/^##\s*.+?\n/, "").trim();
        if (content) {
          const cleanContent = content
            .replace(/\*\*([^*]+)\*\*/g, "$1")
            .replace(/###\s*/g, "")
            .replace(/\n{3,}/g, "\n\n")
            .replace(/^[-•]\s*/gm, "  • ");
          
          const lines = doc.splitTextToSize(cleanContent, pageWidth - margin * 2);
          
          lines.forEach((line: string) => {
            if (yPos > pageHeight - 20) {
              doc.addPage();
              yPos = 20;
            }
            
            if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
              doc.text(line, margin + 3, yPos);
            } else {
              doc.text(line, margin, yPos);
            }
            yPos += 4.2;
          });
          
          yPos += 2;
        }
      });
    }

    const segments = activity.segment_efforts;
    if (segments && segments.length > 0) {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      } else {
        yPos += 10;
      }
      
      doc.setTextColor(...darkGray);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("SEGMENTS", margin, yPos);
      
      yPos += 3;
      doc.setDrawColor(...primaryColor);
      doc.line(margin, yPos, margin + 25, yPos);
      
      yPos += 5;
      
      const segmentData = segments.slice(0, 15).map(seg => [
        (seg.name || "Segment").substring(0, 30),
        formatDistance(seg.distance),
        formatDuration(seg.elapsed_time),
        seg.average_heartrate ? `${Math.round(seg.average_heartrate)}` : "-",
        seg.max_heartrate ? `${Math.round(seg.max_heartrate)}` : "-",
        seg.pr_rank ? `#${seg.pr_rank}` : "-"
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [["Segment Name", "Distance", "Time", "Avg HR", "Max HR", "PR"]],
        body: segmentData,
        theme: "striped",
        headStyles: { 
          fillColor: primaryColor,
          fontSize: 8,
          fontStyle: "bold"
        },
        bodyStyles: {
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        styles: { 
          cellPadding: 2,
          overflow: "linebreak"
        },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 22 },
          2: { cellWidth: 25 },
          3: { cellWidth: 18 },
          4: { cellWidth: 18 },
          5: { cellWidth: 15 }
        },
        margin: { left: margin, right: margin }
      });
    }

    const splits = activity.splits_metric;
    if (splits && splits.length > 0) {
      const lastTableY = (doc as any).lastAutoTable?.finalY || yPos;
      yPos = lastTableY + 15;
      
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setTextColor(...darkGray);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("KILOMETER SPLITS", margin, yPos);
      
      yPos += 3;
      doc.setDrawColor(...primaryColor);
      doc.line(margin, yPos, margin + 40, yPos);
      
      yPos += 5;
      
      const splitData = splits.slice(0, 20).map((split, idx) => [
        `KM ${idx + 1}`,
        formatDuration(split.moving_time),
        formatSpeed(split.average_speed || 0),
        split.average_heartrate ? `${Math.round(split.average_heartrate)}` : "-",
        `${split.elevation_difference?.toFixed(0) || 0} m`
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [["Split", "Time", "Pace", "Avg HR", "Elev Δ"]],
        body: splitData,
        theme: "striped",
        headStyles: { 
          fillColor: primaryColor,
          fontSize: 8,
          fontStyle: "bold"
        },
        bodyStyles: {
          fontSize: 8
        },
        styles: { 
          cellPadding: 2
        },
        margin: { left: margin, right: margin }
      });
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      doc.setFillColor(250, 250, 250);
      doc.rect(0, pageHeight - 12, pageWidth, 12, "F");
      
      doc.setFontSize(7);
      doc.setTextColor(...lightGray);
      doc.setFont("helvetica", "normal");
      doc.text(`CardioKernel Activity Report`, margin, pageHeight - 5);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 5, { align: "center" });
      doc.text(`Activity ID: ${activity.id}`, pageWidth - margin, pageHeight - 5, { align: "right" });
    }

    const safeName = activityName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    doc.save(`cardiokernel_report_${safeName}_${activity.id}.pdf`);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <FileText className="h-4 w-4 mr-1.5" />
      <span className="hidden sm:inline">Export Report</span>
      <span className="sm:hidden">PDF</span>
    </Button>
  );
}
