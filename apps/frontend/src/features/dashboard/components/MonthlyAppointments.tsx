"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import dynamic from "next/dynamic";
import {
  useState,
  useSyncExternalStore,
  useRef,
  useMemo,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MoreDotIcon } from "@/icons";
import { DropdownItem } from "@/shared/components/dropdown/DropdownItem";
import { Dropdown } from "@/shared/components/dropdown/Dropdown";
import type { AppointmentData } from "../types";

interface Props {
  appointments: AppointmentData[];
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const DynamicBarChart = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Bar),
  { ssr: false },
);

function useIsDarkMode() {
  return useSyncExternalStore(
    (callback) => {
      const observer = new MutationObserver(callback);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => observer.disconnect();
    },
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
}

let hasAppointmentsAnimated = false;

export default function MonthlyAppointments({ appointments }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const isDark = useIsDarkMode();
  const router = useRouter();

  const chartRef = useRef<ChartJS<"bar"> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(!hasAppointmentsAnimated);

  const targetData = useMemo(
    () => appointments.map((item) => item.appointments),
    [appointments],
  );

  const maxValue = targetData.length ? Math.max(...targetData) : 0;

  
  const barColors = useMemo(
    () => (isDark ? ["#7D93B3", "#9AA8BD"] : ["#526A8E", "#69778B"]),
    [isDark],
  );

  const [chartData] = useState({
    labels: appointments.map((item) => item.month),
    datasets: [
      {
        label: "Appointments",
        data: targetData.map(() => 0),
        borderRadius: 8,
        backgroundColor: barColors,
      },
    ],
  });


  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    chart.data.datasets[0].backgroundColor = barColors;
    chart.update("none");
  }, [barColors]);

  const options = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "start",
          labels: {
            font: {
              family: "Outfit, sans-serif",
              size: 12,
            },
            color: isDark ? "#EEEAE1" : "#202735",
            boxWidth: 15,
            boxHeight: 15,
          },
        },
        tooltip: {
          callbacks: {
            title: () => "",
            label: (context) => `${context.raw}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: isDark ? "#B6B0A5" : "#625B53",
            font: { family: "Outfit, sans-serif" },
          },
        },
        y: {
          min: 0,
          max: Math.ceil((maxValue * 1.1) / 10) * 10 || 10,
          grid: {
            color: isDark ? "#39414D" : "#E4DFD4",
          },
          border: {
            display: false,
            dash: [5, 5],
          },
          ticks: {
            color: isDark ? "#B6B0A5" : "#625B53",
            font: { family: "Outfit, sans-serif" },
          },
        },
      },
    }),
    [isDark, maxValue],
  );

  useGSAP(() => {
    if (!containerRef.current) return;

    gsap.fromTo(
      containerRef.current,
      {
        opacity: 0,
        y: 40,
        scale: 0.97,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.9,
        ease: "power3.out",
        delay: 0.1,
      },
    );
  }, []);

  useGSAP(() => {
    if (!chartWrapperRef.current) return;

    gsap.fromTo(
      chartWrapperRef.current,
      {
        opacity: 0,
        y: 25,
      },
      {
        opacity: 1,
        y: 0,
        duration: 2,
        ease: "power3.out",
        delay: 0.2,
      },
    );
  }, []);

  useGSAP(() => {
    if (!appointments.length) return;

    let rafId: number;
    let tween: gsap.core.Tween | undefined;

    const startAnimation = () => {
      if (!chartRef.current) {
        rafId = requestAnimationFrame(startAnimation);
        return;
      }

      const chart = chartRef.current;

      const safeUpdate = (values: number[]) => {
        if (!chart.canvas || !chart.ctx || !chart.canvas.ownerDocument) return;
        chart.data.datasets[0].data = values;
        chart.data.datasets[0].backgroundColor = barColors;
        chart.update("none");
      };

      if (!isFirstMount.current) {
        safeUpdate(targetData);
        return;
      }

      hasAppointmentsAnimated = true;
      isFirstMount.current = false;

      const proxy = targetData.map(() => ({ v: 0 }));
      safeUpdate(proxy.map((p) => p.v));

      tween = gsap.to(proxy, {
        v: (i: number) => targetData[i],
        duration: 1.5,
        ease: "elastic.out(1, 0.5)",
        stagger: 0.08,
        delay: 0.45,
        onUpdate: () => {
          if (!chart.canvas || !chart.ctx || !chart.canvas.ownerDocument)
            return;
          safeUpdate(proxy.map((p) => p.v));
        },
      });
    };

    rafId = requestAnimationFrame(startAnimation);

    return () => {
      cancelAnimationFrame(rafId);
      tween?.kill();
    };
  }, [appointments, targetData, barColors]);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 opacity-0 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Monthly Appointments
        </h3>

        <div className="relative inline-block">
          <button onClick={toggleDropdown} className="dropdown-toggle">
            <span className="text-gray-300 hover:text-gray-700 dark:hover:text-gray-300">
              <MoreDotIcon />
            </span>
          </button>

          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={() => {
                closeDropdown();
                router.push("/appointments");
              }}
              className="flex w-full rounded-lg text-left font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View More
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div
        ref={chartWrapperRef}
        className="custom-scrollbar max-w-full overflow-x-auto opacity-0"
      >
        <div className="-ml-5 mt-4 h-55 min-w-162.5 pl-2 xl:min-w-full">
          <DynamicBarChart ref={chartRef} data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
}
